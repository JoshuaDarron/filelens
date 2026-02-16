import { useContext, useEffect, useCallback, useState, useMemo, useRef, memo } from 'react'
import { FileContext } from '../../context/FileContext'
import { useToast } from '../../hooks/useToast'
import { useFileLoader } from '../../hooks/useFileLoader'
import { usePathBar } from '../../hooks/usePathBar'
import { usePathBarPortal } from '../../hooks/usePathBarPortal'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { downloadFile } from '../../utils/fileHelpers'
import { AISidebar } from '../../components/AISidebar/AISidebar'
import { SemanticSearchView } from '../../components/AISidebar/SemanticSearchView'
import { InsightsView } from '../../components/AISidebar/InsightsView'
import { useAISidebar } from '../../hooks/useAISidebar'
import { useAI } from '../../hooks/useAI'
import { useAISettings } from '../../hooks/useAISettings'
import { useSearchIndex } from '../../hooks/useSearchIndex'

const JsonNode = memo(function JsonNode({ data, path = '', level = 0, collapsed = false }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed && level > 2)

  if (data === null) {
    return <span className="json-value null">null</span>
  }

  if (typeof data === 'boolean') {
    return <span className="json-value boolean">{data.toString()}</span>
  }

  if (typeof data === 'number') {
    return <span className="json-value number">{data}</span>
  }

  if (typeof data === 'string') {
    return <span className="json-value string">"{data}"</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="json-bracket">[]</span>
    }

    return (
      <span>
        <span
          className={`json-collapsible ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
        <span className="json-bracket">[</span>
        {isCollapsed ? (
          <span className="json-ellipsis"> {data.length} items </span>
        ) : (
          <div className="json-node">
            {data.map((item, index) => (
              <div key={index}>
                <JsonNode data={item} path={`${path}[${index}]`} level={level + 1} />
                {index < data.length - 1 && ','}
              </div>
            ))}
          </div>
        )}
        <span className="json-bracket">]</span>
      </span>
    )
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data)
    if (keys.length === 0) {
      return <span className="json-bracket">{'{}'}</span>
    }

    return (
      <span>
        <span
          className={`json-collapsible ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
        <span className="json-bracket">{'{'}</span>
        {isCollapsed ? (
          <span className="json-ellipsis"> {keys.length} keys </span>
        ) : (
          <div className="json-node">
            {keys.map((key, index) => (
              <div key={key}>
                <span className="json-key">"{key}"</span>: {' '}
                <JsonNode data={data[key]} path={`${path}.${key}`} level={level + 1} />
                {index < keys.length - 1 && ','}
              </div>
            ))}
          </div>
        )}
        <span className="json-bracket">{'}'}</span>
      </span>
    )
  }

  return <span>{String(data)}</span>
})

export function JsonViewer() {
  const {
    fileData,
    filename,
    fileHandle,
    isLoading,
    setIsLoading,
    loadFile,
    resetFile
  } = useContext(FileContext)

  const toast = useToast()
  const { loadFromFile, openFilePicker, isValidFile } = useFileLoader()
  const { aiEnabled } = useAISettings()
  const { isAIReady } = useAI()
  const sidebar = useAISidebar()
  const searchIndex = useSearchIndex(fileData, 'json', sidebar.isSidebarOpen)
  const [viewMode, setViewMode] = useState('tree') // 'tree' or 'raw'
  const [rawText, setRawText] = useState('')
  const rawPreRef = useRef(null)
  const rawLines = useMemo(() => rawText ? rawText.split('\n') : [], [rawText])

  useEffect(() => {
    sidebar.closeSidebar()
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = useCallback(() => {
    sidebar.toggleSidebar()
  }, [sidebar.toggleSidebar])

  const handleSearchResultClick = useCallback((result) => {
    if (!result.text || !rawText) return

    const searchKey = result.text.split(':')[0]?.trim().replace(/"/g, '')

    if (viewMode === 'tree') {
      // Find matching key in the tree DOM
      if (!searchKey) return
      const keyEls = document.querySelectorAll('.json-key')
      const target = Array.from(keyEls).find(el => el.textContent === `"${searchKey}"`)
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.classList.remove('ai-search-highlight')
      void target.offsetWidth
      target.classList.add('ai-search-highlight')
      setTimeout(() => target.classList.remove('ai-search-highlight'), 2000)
    } else {
      // Raw view — find the matching line and highlight it
      const lines = rawText.split('\n')
      let targetLine = -1
      if (searchKey) {
        targetLine = lines.findIndex(line => line.includes(`"${searchKey}"`))
      }
      if (targetLine === -1) {
        const fragment = result.text.slice(0, 40)
        targetLine = lines.findIndex(line => line.includes(fragment))
      }
      if (targetLine === -1) return

      const lineEl = document.querySelector(`.line-numbers .line-number:nth-child(${targetLine + 1})`)
      if (!lineEl) return
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      lineEl.classList.remove('ai-search-highlight')
      void lineEl.offsetWidth
      lineEl.classList.add('ai-search-highlight')
      setTimeout(() => lineEl.classList.remove('ai-search-highlight'), 2000)
    }
  }, [viewMode, rawText])

  const processJSONText = useCallback((text, fname, handle = null, url = null) => {
    try {
      const data = JSON.parse(text)
      loadFile(data, fname, 'json', handle, url)
      setRawText(JSON.stringify(data, null, 2))
      toast.success('JSON loaded successfully!')
    } catch (error) {
      toast.error(`Invalid JSON: ${error.message}`)
    }
  }, [loadFile, toast])

  const handleOpenFile = useCallback(async (fileOrEvent) => {
    if (fileOrEvent instanceof File) {
      try {
        const { text, filename: fname } = await loadFromFile(fileOrEvent, null)
        processJSONText(text, fname, null, null)
      } catch {
        // Error already handled
      }
      return
    }

    if (window.showOpenFilePicker) {
      try {
        const result = await openFilePicker({
          'application/json': ['.json']
        })
        if (result) {
          const { text, filename: fname } = await loadFromFile(result.file, result.handle)
          processJSONText(text, fname, result.handle, null)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Error already handled
        }
      }
    }
  }, [loadFromFile, openFilePicker, processJSONText])

  const handleFileDrop = useCallback(async (file, handle) => {
    if (!isValidFile(file, ['.json'])) {
      toast.error('Please drop a valid JSON file (.json)')
      return
    }
    try {
      const { text, filename: fname } = await loadFromFile(file, handle)
      processJSONText(text, fname, handle, null)
    } catch {
      // Error already handled
    }
  }, [isValidFile, loadFromFile, processJSONText, toast])

  const handleExport = useCallback(() => {
    if (!fileData) return

    try {
      const content = JSON.stringify(fileData, null, 2)
      const success = downloadFile(content, filename || 'data.json', 'application/json')
      if (success) {
        toast.success('JSON exported successfully!')
      }
    } catch (error) {
      toast.error(`Error exporting JSON: ${error.message}`)
    }
  }, [fileData, filename, toast])

  const handleCopy = useCallback(async () => {
    if (!fileData) return
    try {
      const text = JSON.stringify(fileData, null, 2)
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [fileData, toast])

  // Load from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const jsonUrl = urlParams.get('url')
    const type = urlParams.get('type')

    if (jsonUrl && type === 'json') {
      setIsLoading(true)
      const loadFromURL = async () => {
        const loadingId = toast.loading('Loading JSON...')
        try {
          let text
          let fname

          if (jsonUrl.startsWith('file://')) {
            const xhr = new XMLHttpRequest()
            text = await new Promise((resolve, reject) => {
              xhr.open('GET', jsonUrl, true)
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
            let path = decodeURIComponent(jsonUrl.replace('file:///', '').replace('file://', ''))
            path = path.replace(/\//g, '\\')
            fname = path.split('\\').pop() || path.split('/').pop() || 'local.json'
          } else {
            const response = await fetch(jsonUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch JSON: ${response.statusText}`)
            }
            text = await response.text()
            const pathname = new URL(jsonUrl).pathname
            fname = pathname.split('/').pop() || 'remote.json'
          }

          toast.hide(loadingId)
          setIsLoading(false)
          processJSONText(text, fname, null, jsonUrl)
        } catch (error) {
          toast.hide(loadingId)
          setIsLoading(false)
          toast.error(`Error loading JSON: ${error.message}`)
        }
      }
      loadFromURL()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const showAnalyze = aiEnabled && isAIReady

  const statsLabel = useMemo(() => {
    if (!fileData) return null
    if (Array.isArray(fileData)) return `${fileData.length} items`
    if (typeof fileData === 'object') return `${Object.keys(fileData).length} keys`
    return null
  }, [fileData])

  usePathBar({})

  const { renderControls } = usePathBarPortal()

  if (!fileData) {
    return (
      <main className="main-content">
        {isLoading ? (
          <div className="viewer-loading">
            <div className="viewer-loading-spinner"></div>
            <div className="viewer-loading-text">Loading...</div>
          </div>
        ) : (
          <EmptyState
            icon="bi-filetype-json"
            title="JSON Viewer"
            description="Open a JSON file to view and explore its contents with a collapsible tree view."
            onFileDrop={handleFileDrop}
            onOpenFile={handleOpenFile}
            acceptedExtensions={['.json']}
            dropZoneText="Drop your JSON file here"
            dropZoneButtonText="Choose JSON File"
          />
        )}
      </main>
    )
  }

  return (
    <>
      {renderControls(
        <>
          {statsLabel && (
            <div className="stats">
              <div className="stat">
                <i className="bi bi-hdd"></i>
                <span>{statsLabel}</span>
              </div>
            </div>
          )}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
              onClick={() => setViewMode('raw')}
            >
              Raw
            </button>
          </div>
          <button
            className="btn btn-outline"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <i className="bi bi-clipboard"></i>
          </button>
          <button className="btn btn-success" onClick={handleExport}>
            <i className="bi bi-download"></i>
          </button>
          {showAnalyze && !!fileData && (
            <button className="btn btn-outline ai-analyze-btn" onClick={handleAnalyze} title="AI Insights">
              <i className="bi bi-stars"></i>
            </button>
          )}
        </>
      )}
      <div className="viewer-layout">
        <main className="main-content">
          <div className="json-container">
            {viewMode === 'tree' ? (
              <div className="json-wrapper">
                <div className="line-numbers">
                  {rawLines.map((_, i) => (
                    <span key={i} className="line-number">{i + 1}</span>
                  ))}
                </div>
                <div className="json-tree">
                  <JsonNode data={fileData} />
                </div>
              </div>
            ) : (
              <div className="json-raw-wrapper">
                <div className="line-numbers">
                  {rawLines.map((_, i) => (
                    <span key={i} className="line-number">{i + 1}</span>
                  ))}
                </div>
                <pre className="json-raw" ref={rawPreRef}>{rawText}</pre>
              </div>
            )}
          </div>
        </main>
        {showAnalyze && (
          <AISidebar
            isOpen={sidebar.isSidebarOpen}
            onClose={sidebar.closeSidebar}
            insightsContent={<InsightsView fileData={fileData} fileType="json" filename={filename} />}
          >
            <SemanticSearchView index={searchIndex.index} indexing={searchIndex.indexing} indexProgress={searchIndex.indexProgress} indexError={searchIndex.error} onResultClick={handleSearchResultClick} />
          </AISidebar>
        )}
      </div>
    </>
  )
}
