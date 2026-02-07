import { useContext, useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { marked } from 'marked'
import { FileContext } from '../../context/FileContext'
import { useToast } from '../../hooks/useToast'
import { useFileLoader } from '../../hooks/useFileLoader'
import { Header } from '../../components/Header'
import { EmptyState } from '../../components/EmptyState'
import { downloadFile, saveFile } from '../../utils/fileHelpers'

marked.setOptions({
  breaks: true,
  gfm: true
})

export function TxtViewer() {
  const {
    fileData,
    filename,
    fileType,
    fileHandle,
    isModified,
    loadFile,
    updateData,
    markSaved
  } = useContext(FileContext)

  const toast = useToast()
  const { loadFromFile, openFilePicker, isValidFile } = useFileLoader()
  const [viewMode, setViewMode] = useState(null) // null until file loads; 'edit' | 'split' | 'preview' for md, 'raw' for txt
  const [wordWrap, setWordWrap] = useState(true)
  const [splitPosition, setSplitPosition] = useState(50) // percentage for editor pane width

  const isMarkdown = fileType === 'md'

  // Synchronous scrolling for split mode
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const scrollingRef = useRef(null)
  const containerRef = useRef(null)

  const handleDividerMouseDown = useCallback((e) => {
    e.preventDefault()
    document.body.classList.add('split-resizing')

    const onMouseMove = (moveEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setSplitPosition(Math.min(80, Math.max(20, pct)))
    }

    const onMouseUp = () => {
      document.body.classList.remove('split-resizing')
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const handleSyncScroll = useCallback((source) => {
    if (scrollingRef.current && scrollingRef.current !== source) return
    scrollingRef.current = source

    const editor = editorRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    const sourceEl = source === 'editor' ? editor : preview
    const targetEl = source === 'editor' ? preview : editor

    const scrollRatio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1)
    targetEl.scrollTop = scrollRatio * (targetEl.scrollHeight - targetEl.clientHeight)

    requestAnimationFrame(() => { scrollingRef.current = null })
  }, [])

  // Set default view mode when file type changes
  useEffect(() => {
    setViewMode(isMarkdown ? 'split' : 'raw')
  }, [isMarkdown])

  const lines = useMemo(() => {
    if (!fileData) return []
    return fileData.split('\n')
  }, [fileData])

  const renderedHtml = useMemo(() => {
    if (!fileData || !isMarkdown) return ''
    return marked.parse(fileData)
  }, [fileData, isMarkdown])

  const handleEditorChange = useCallback((e) => {
    updateData(e.target.value)
  }, [updateData])

  const processText = useCallback((text, fname, type, handle = null, url = null) => {
    loadFile(text, fname, type, handle, url)
    toast.success('File loaded successfully!')
  }, [loadFile, toast])

  const handleOpenFile = useCallback(async (fileOrEvent) => {
    if (fileOrEvent instanceof File) {
      try {
        const { text, filename: fname, fileType: type } = await loadFromFile(fileOrEvent, null)
        processText(text, fname, type, null, null)
      } catch {
        // Error already handled
      }
      return
    }

    if (window.showOpenFilePicker) {
      try {
        const result = await openFilePicker()
        if (result) {
          const { text, filename: fname, fileType: type } = await loadFromFile(result.file, result.handle)
          processText(text, fname, type, result.handle, null)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Error already handled
        }
      }
    }
  }, [loadFromFile, openFilePicker, processText])

  const handleFileDrop = useCallback(async (file, handle) => {
    if (!isValidFile(file)) {
      toast.error('Unsupported file type')
      return
    }
    try {
      const { text, filename: fname, fileType: type } = await loadFromFile(file, handle)
      processText(text, fname, type, handle, null)
    } catch {
      // Error already handled
    }
  }, [isValidFile, loadFromFile, processText, toast])

  const handleSave = useCallback(async () => {
    if (!fileHandle || !fileData) return

    try {
      await saveFile(fileHandle, fileData)
      markSaved()
      toast.success('File saved successfully!')
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(`Error saving file: ${err.message}`)
      }
    }
  }, [fileHandle, fileData, markSaved, toast])

  const handleExport = useCallback(() => {
    if (!fileData) return

    try {
      const ext = isMarkdown ? '.md' : '.txt'
      const exportFilename = filename || `document${ext}`
      const success = downloadFile(fileData, exportFilename, 'text/plain')
      if (success) {
        toast.success('File exported successfully!')
      }
    } catch (error) {
      toast.error(`Error exporting file: ${error.message}`)
    }
  }, [fileData, filename, isMarkdown, toast])

  // Load from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const txtUrl = urlParams.get('url')
    const type = urlParams.get('type')

    if (txtUrl && (type === 'txt' || type === 'md')) {
      const loadFromURL = async () => {
        const loadingId = toast.loading('Loading file...')
        try {
          let text
          let fname

          if (txtUrl.startsWith('file://')) {
            const xhr = new XMLHttpRequest()
            text = await new Promise((resolve, reject) => {
              xhr.open('GET', txtUrl, true)
              xhr.responseType = 'text'
              xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 0) {
                  resolve(xhr.responseText)
                } else {
                  reject(new Error(`Failed to load file: ${xhr.statusText}`))
                }
              }
              xhr.onerror = () => reject(new Error('Failed to load local file'))
              xhr.send()
            })
            let path = decodeURIComponent(txtUrl.replace('file:///', '').replace('file://', ''))
            path = path.replace(/\//g, '\\')
            fname = path.split('\\').pop() || path.split('/').pop() || `local.${type}`
          } else {
            const response = await fetch(txtUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.statusText}`)
            }
            text = await response.text()
            const pathname = new URL(txtUrl).pathname
            fname = pathname.split('/').pop() || `remote.${type}`
          }

          toast.hide(loadingId)
          processText(text, fname, type, null, txtUrl)
        } catch (error) {
          toast.hide(loadingId)
          if (txtUrl.startsWith('file://')) {
            toast.error(
              'Unable to load local file. Please ensure "Allow access to file URLs" is enabled in the extension settings.',
              'File Access Error',
              { duration: 10000 }
            )
          } else {
            toast.error(`Error loading file: ${error.message}`)
          }
        }
      }
      loadFromURL()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = fileData ? { lines: lines.length } : null

  if (!fileData) {
    return (
      <>
        <Header />
        <main className="main-content">
          <EmptyState
            icon="bi-file-text"
            title="Text Viewer"
            description="Open a text file to view its contents with line numbers. Supports TXT and Markdown files."
            onFileDrop={handleFileDrop}
            onOpenFile={handleOpenFile}
            acceptedExtensions={['.txt', '.md']}
            dropZoneText="Drop your text file here"
            dropZoneButtonText="Choose Text File"
          />
        </main>
      </>
    )
  }

  return (
    <>
      <Header
        onSave={handleSave}
        onExport={handleExport}
        showSave={!!fileHandle}
        showExport={true}
        stats={stats}
      >
        {isMarkdown && (
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              Edit
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              Preview
            </button>
          </div>
        )}
        {!isMarkdown && (
          <button
            className={`btn btn-outline ${!wordWrap ? 'active' : ''}`}
            onClick={() => setWordWrap(!wordWrap)}
            title="Toggle word wrap"
          >
            <i className="bi bi-text-wrap"></i>
          </button>
        )}
      </Header>
      <main className="main-content">
        {isMarkdown ? (
          <div className={`md-split-container md-mode-${viewMode}`} ref={containerRef}>
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div
                className="md-editor-pane"
                style={viewMode === 'split' ? { flex: `0 0 ${splitPosition}%` } : undefined}
              >
                <textarea
                  ref={editorRef}
                  className="md-editor-textarea"
                  value={fileData}
                  onChange={handleEditorChange}
                  onScroll={viewMode === 'split' ? () => handleSyncScroll('editor') : undefined}
                  spellCheck={false}
                />
              </div>
            )}
            {viewMode === 'split' && (
              <div className="md-split-divider" onMouseDown={handleDividerMouseDown} />
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div
                className="md-preview-pane"
                ref={previewRef}
                onScroll={viewMode === 'split' ? () => handleSyncScroll('preview') : undefined}
                style={viewMode === 'split' ? { flex: 1 } : undefined}
              >
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="txt-container">
            <div className="txt-wrapper">
              <div className="line-numbers">
                {lines.map((_, index) => (
                  <span key={index} className="line-number">{index + 1}</span>
                ))}
              </div>
              <div className={`txt-content ${!wordWrap ? 'no-wrap' : ''}`}>
                {lines.map((line, index) => (
                  <span key={index} className="txt-line">{line || '\u00A0'}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
