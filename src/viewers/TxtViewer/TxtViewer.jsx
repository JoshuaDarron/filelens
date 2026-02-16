import { useContext, useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { FileContext } from '../../context/FileContext'
import { useToast } from '../../hooks/useToast'
import { useFileLoader } from '../../hooks/useFileLoader'
import { Header } from '../../components/Header/Header'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { downloadFile, saveFile } from '../../utils/fileHelpers'
import { AISidebar } from '../../components/AISidebar/AISidebar'
import { SemanticSearchView } from '../../components/AISidebar/SemanticSearchView'
import { InsightsView } from '../../components/AISidebar/InsightsView'
import { useAISidebar } from '../../hooks/useAISidebar'
import { useAI } from '../../hooks/useAI'
import { useAISettings } from '../../hooks/useAISettings'
import { useSearchIndex } from '../../hooks/useSearchIndex'

const EXT_TO_LANG = {
  jsx: 'javascript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',
  hpp: 'cpp',
  hxx: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  ps1: 'powershell',
  bat: 'dos',
  cmd: 'dos',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: null,
  txt: null,
}

function getLanguage(filename) {
  if (!filename) return null
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return null
  if (ext in EXT_TO_LANG) return EXT_TO_LANG[ext]
  if (hljs.getLanguage(ext)) return ext
  return null
}

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    }
  }),
  { breaks: true, gfm: true }
)

export function TxtViewer() {
  const {
    fileData,
    filename,
    fileType,
    fileHandle,
    isModified,
    isLoading,
    setIsLoading,
    loadFile,
    updateData,
    markSaved
  } = useContext(FileContext)

  const toast = useToast()
  const { loadFromFile, openFilePicker, isValidFile } = useFileLoader()
  const { aiEnabled } = useAISettings()
  const { isAIReady } = useAI()
  const aiSidebar = useAISidebar()
  const searchIndex = useSearchIndex(fileData, fileType, aiSidebar.isSidebarOpen)
  const [viewMode, setViewMode] = useState(null)

  useEffect(() => {
    aiSidebar.closeSidebar()
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = useCallback(() => {
    aiSidebar.toggleSidebar()
  }, [aiSidebar.toggleSidebar])

  // null until file loads; 'edit' | 'split' | 'preview' for md, 'raw' for txt
  const [wordWrap, setWordWrap] = useState(true)
  const [splitPosition, setSplitPosition] = useState(50) // percentage for editor pane width

  const isMarkdown = fileType === 'md'

  // Derive a safe view mode — prevents blank render when isMarkdown flips
  // before the viewMode effect catches up
  const activeViewMode = isMarkdown
    ? (['edit', 'split', 'preview'].includes(viewMode) ? viewMode : 'split')
    : (['raw', 'edit'].includes(viewMode) ? viewMode : 'raw')

  const handleSearchResultClick = useCallback((result) => {
    if (result.lineIndex == null) return

    if (viewMode === 'edit' || (isMarkdown && viewMode === 'split')) {
      // Scroll textarea to the target line
      const textarea = editorRef.current
      if (!textarea) return
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20
      const scrollTop = result.lineIndex * lineHeight - textarea.clientHeight / 2
      textarea.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
    } else {
      // In view/raw/preview modes, target the line elements
      const txtLineEl = document.querySelector(`.txt-content .txt-line:nth-child(${result.lineIndex + 1})`)
      const lineNumberEl = document.querySelector(`.line-numbers .line-number:nth-child(${result.lineIndex + 1})`)
      const target = txtLineEl || lineNumberEl
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.classList.remove('ai-search-highlight')
      void target.offsetWidth
      target.classList.add('ai-search-highlight')
      setTimeout(() => target.classList.remove('ai-search-highlight'), 2000)
    }
  }, [viewMode, isMarkdown])

  // Synchronous scrolling for split mode
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const scrollingRef = useRef(null)
  const containerRef = useRef(null)
  const editLineNumRef = useRef(null)
  const mdLineNumRef = useRef(null)

  const handleEditScroll = useCallback((e) => {
    if (editLineNumRef.current) {
      editLineNumRef.current.scrollTop = e.target.scrollTop
    }
  }, [])

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

  const syncRafRef = useRef(null)

  const handleSyncScroll = useCallback((source) => {
    if (scrollingRef.current && scrollingRef.current !== source) return
    scrollingRef.current = source

    if (syncRafRef.current) return
    syncRafRef.current = requestAnimationFrame(() => {
      syncRafRef.current = null
      const editor = editorRef.current
      const preview = previewRef.current
      if (!editor || !preview) { scrollingRef.current = null; return }

      const sourceEl = source === 'editor' ? editor : preview
      const targetEl = source === 'editor' ? preview : editor

      const scrollRatio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1)
      targetEl.scrollTop = scrollRatio * (targetEl.scrollHeight - targetEl.clientHeight)

      requestAnimationFrame(() => { scrollingRef.current = null })
    })
  }, [])

  const handleMdEditScroll = useCallback((e) => {
    if (mdLineNumRef.current) {
      mdLineNumRef.current.scrollTop = e.target.scrollTop
    }
    if (viewMode === 'split') handleSyncScroll('editor')
  }, [viewMode, handleSyncScroll])

  // Set default view mode when file type changes
  useEffect(() => {
    setViewMode(isMarkdown ? 'split' : 'raw')
  }, [isMarkdown])

  const lines = useMemo(() => {
    if (fileData == null) return []
    return fileData.split('\n')
  }, [fileData])

  const [renderedHtml, setRenderedHtml] = useState('')

  useEffect(() => {
    if (fileData == null || !isMarkdown) {
      setRenderedHtml('')
      return
    }
    const timer = setTimeout(() => {
      setRenderedHtml(marked.parse(fileData))
    }, 250)
    return () => clearTimeout(timer)
  }, [fileData, isMarkdown])

  const language = useMemo(() => getLanguage(filename), [filename])

  const highlightedHtml = useMemo(() => {
    if (!fileData || !language) return null
    try {
      return hljs.highlight(fileData, { language }).value
    } catch {
      return null
    }
  }, [fileData, language])

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
      setIsLoading(true)
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
          setIsLoading(false)
          processText(text, fname, type, null, txtUrl)
        } catch (error) {
          toast.hide(loadingId)
          setIsLoading(false)
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

  if (fileData == null) {
    return (
      <>
        <Header />
        <main className="main-content">
          {isLoading ? (
            <div className="viewer-loading">
              <div className="viewer-loading-spinner"></div>
              <div className="viewer-loading-text">Loading...</div>
            </div>
          ) : (
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
          )}
        </main>
      </>
    )
  }

  const showAnalyze = aiEnabled && isAIReady

  return (
    <>
      <Header
        onSave={handleSave}
        onExport={handleExport}
        onAnalyze={handleAnalyze}
        showSave={!!fileHandle}
        showExport={true}
        showAnalyze={showAnalyze}
        stats={stats}
      >
        {isMarkdown && (
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${activeViewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              Edit
            </button>
            <button
              className={`view-toggle-btn ${activeViewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
            <button
              className={`view-toggle-btn ${activeViewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              Preview
            </button>
          </div>
        )}
        {!isMarkdown && (
          <>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${activeViewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
              >
                View
              </button>
              <button
                className={`view-toggle-btn ${activeViewMode === 'edit' ? 'active' : ''}`}
                onClick={() => setViewMode('edit')}
              >
                Edit
              </button>
            </div>
            <button
              className={`btn btn-outline ${!wordWrap ? 'active' : ''}`}
              onClick={() => setWordWrap(!wordWrap)}
              title="Toggle word wrap"
            >
              <i className="bi bi-text-wrap"></i>
            </button>
          </>
        )}
      </Header>
      <div className="viewer-layout">
        <main className="main-content">
          {isMarkdown ? (
            <div className={`md-split-container md-mode-${activeViewMode}`} ref={containerRef}>
              {(activeViewMode === 'edit' || activeViewMode === 'split') && (
                <div
                  className="md-editor-pane"
                  style={activeViewMode === 'split' ? { flex: `0 0 ${splitPosition}%` } : undefined}
                >
                  <div className="line-numbers md-line-numbers" ref={mdLineNumRef}>
                    {lines.map((_, i) => (
                      <span key={i} className="line-number">{i + 1}</span>
                    ))}
                  </div>
                  <textarea
                    ref={editorRef}
                    className="md-editor-textarea"
                    value={fileData}
                    onChange={handleEditorChange}
                    onScroll={handleMdEditScroll}
                    spellCheck={false}
                  />
                </div>
              )}
              {activeViewMode === 'split' && (
                <div className="md-split-divider" onMouseDown={handleDividerMouseDown} />
              )}
              {(activeViewMode === 'preview' || activeViewMode === 'split') && (
                <div
                  className="md-preview-pane"
                  ref={previewRef}
                  onScroll={activeViewMode === 'split' ? () => handleSyncScroll('preview') : undefined}
                  style={activeViewMode === 'split' ? { flex: 1 } : undefined}
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
              {activeViewMode === 'edit' ? (
                <div className="txt-editor-wrapper">
                  <div className="line-numbers" ref={editLineNumRef}>
                    {lines.map((_, i) => (
                      <span key={i} className="line-number">{i + 1}</span>
                    ))}
                  </div>
                  <textarea
                    className="txt-editor-textarea"
                    value={fileData}
                    onChange={handleEditorChange}
                    spellCheck={false}
                    style={{ whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
                    onScroll={handleEditScroll}
                  />
                </div>
              ) : (
                <div className="txt-wrapper">
                  <div className="line-numbers">
                    {lines.map((_, index) => (
                      <span key={index} className="line-number">{index + 1}</span>
                    ))}
                  </div>
                  <div className={`txt-content ${!wordWrap ? 'no-wrap' : ''}`}>
                    {highlightedHtml ? (
                      <code
                        className="hljs"
                        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                      />
                    ) : (
                      lines.map((line, index) => (
                        <span key={index} className="txt-line">{line || '\u00A0'}</span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        {showAnalyze && (
          <AISidebar
            isOpen={aiSidebar.isSidebarOpen}
            onClose={aiSidebar.closeSidebar}
            insightsContent={<InsightsView fileData={fileData} fileType={fileType} filename={filename} />}
          >
            <SemanticSearchView index={searchIndex.index} indexing={searchIndex.indexing} indexProgress={searchIndex.indexProgress} indexError={searchIndex.error} onResultClick={handleSearchResultClick} />
          </AISidebar>
        )}
      </div>
    </>
  )
}
