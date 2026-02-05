import { useContext, useEffect, useCallback, useState, useMemo } from 'react'
import { FileContext } from '../../context/FileContext'
import { useToast } from '../../hooks/useToast'
import { useFileLoader } from '../../hooks/useFileLoader'
import { Header } from '../../components/Header'
import { EmptyState } from '../../components/EmptyState'
import { downloadFile, saveFile } from '../../utils/fileHelpers'

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
  const [viewMode, setViewMode] = useState('raw') // 'raw' or 'rendered' (for markdown)
  const [wordWrap, setWordWrap] = useState(true)

  const isMarkdown = fileType === 'md'
  const lines = useMemo(() => {
    if (!fileData) return []
    return fileData.split('\n')
  }, [fileData])

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
        const result = await openFilePicker({
          'text/plain': ['.txt', '.md']
        })
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
    if (!isValidFile(file, ['.txt', '.md'])) {
      toast.error('Please drop a valid text file (.txt, .md)')
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
          toast.error(`Error loading file: ${error.message}`)
        }
      }
      loadFromURL()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = fileData ? { lines: lines.length } : null

  if (!fileData) {
    return (
      <>
        <Header onOpenFile={handleOpenFile} />
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
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        onExport={handleExport}
        showSave={!!fileHandle}
        showExport={true}
        stats={stats}
      >
        {isMarkdown && (
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
              onClick={() => setViewMode('raw')}
            >
              Raw
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`}
              onClick={() => setViewMode('rendered')}
            >
              Preview
            </button>
          </div>
        )}
        <button
          className={`btn btn-outline ${!wordWrap ? 'active' : ''}`}
          onClick={() => setWordWrap(!wordWrap)}
          title="Toggle word wrap"
        >
          <i className="bi bi-text-wrap"></i>
        </button>
      </Header>
      <main className="main-content">
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
      </main>
    </>
  )
}
