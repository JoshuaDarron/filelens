import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useToast } from '../../hooks/useToast'
import { Header } from '../../components/Header'
import { formatFileSize } from '../../utils/fileHelpers'

// Parse Chrome's directory listing HTML to extract file entries
function parseDirectoryListing(html, baseUrl) {
  const entries = []

  // Chrome's addRow() format (7 params):
  // addRow("name", "rawBytes", isDir, sizeBytes, "sizeStr", modifiedTimestamp, "modifiedStr")
  // - name/rawBytes: JSON-escaped strings (quoted)
  // - isDir: 0 or 1 (unquoted int)
  // - sizeBytes: raw byte count or negative (unquoted int)
  // - sizeStr: human-readable size (quoted)
  // - modifiedTimestamp: unix epoch seconds or 0 (unquoted int)
  // - modifiedStr: formatted date string (quoted)
  const addRowRegex = /addRow\("([^"]*?)","([^"]*?)",(\d),([-\d]+),"([^"]*?)",([\d]+),"([^"]*?)"\)/g
  let match

  while ((match = addRowRegex.exec(html)) !== null) {
    const [, name, rawBytes, isDir, sizeBytes, , timestamp] = match

    // Skip parent directory link
    if (name === '..') continue

    const kind = isDir === '1' ? 'directory' : 'file'

    // rawBytes is the URL-encoded path segment for the entry
    // Ensure baseUrl ends with '/' so relative paths resolve correctly
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
    let entryUrl = new URL(rawBytes, normalizedBase).href

    // Directory URLs must end with '/' for correct child path resolution
    if (kind === 'directory' && !entryUrl.endsWith('/')) {
      entryUrl += '/'
    }

    const entry = {
      name,
      kind,
      url: entryUrl
    }

    const size = parseInt(sizeBytes, 10)
    if (kind === 'file' && size >= 0) {
      entry.size = size
    }

    const ts = parseInt(timestamp, 10)
    if (ts > 0) {
      entry.modified = ts * 1000 // Convert seconds to milliseconds
    }

    entries.push(entry)
  }

  return entries
}

// Build breadcrumb segments from a file:// URL
function buildBreadcrumbsFromUrl(dirUrl) {
  try {
    const parsed = new URL(dirUrl)
    const pathname = decodeURIComponent(parsed.pathname)

    // On Windows: pathname is like /C:/Users/... — split and filter empties
    const segments = pathname.split('/').filter(Boolean)
    const crumbs = []

    for (let i = 0; i < segments.length; i++) {
      // Reconstruct the URL up to this segment
      const pathUpTo = '/' + segments.slice(0, i + 1).join('/') + '/'
      crumbs.push({
        name: segments[i],
        url: `file://${pathUpTo}`
      })
    }

    return crumbs
  } catch {
    return [{ name: dirUrl, url: dirUrl }]
  }
}

export function FileBrowser({ onFileSelect, dirUrl }) {
  const toast = useToast()
  const [files, setFiles] = useState([])
  const [currentPath, setCurrentPath] = useState([])
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('fileBrowser-viewMode') || 'list') // 'list' or 'grid'
  const [isLoading, setIsLoading] = useState(false)
  const [directoryHandle, setDirectoryHandle] = useState(null)
  const [directoryUrl, setDirectoryUrl] = useState(dirUrl || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null })
  const contextMenuRef = useRef(null)

  // URL-based mode: is active when we have a directoryUrl but no directoryHandle
  const isUrlMode = !!directoryUrl && !directoryHandle

  const getFileIcon = (file) => {
    if (file.kind === 'directory') return 'bi-folder-fill folder'
    const ext = file.name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'csv': return 'bi-filetype-csv csv'
      case 'json': return 'bi-filetype-json json'
      case 'txt': return 'bi-file-text txt'
      case 'md': return 'bi-markdown txt'
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg': return 'bi-file-image image'
      case 'pdf': return 'bi-file-pdf pdf'
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java': return 'bi-file-code code'
      default: return 'bi-file-earmark file'
    }
  }

  // Fetch and parse a directory listing from a file:// URL
  const fetchDirectoryListing = useCallback(async (url) => {
    try {
      setIsLoading(true)
      setSearchQuery('')

      const response = await fetch(url)
      const html = await response.text()
      const entries = parseDirectoryListing(html, url)

      // Sort: directories first, then files alphabetically
      entries.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      setFiles(entries)
      setDirectoryUrl(url)
      setCurrentPath(buildBreadcrumbsFromUrl(url))
    } catch (err) {
      toast.error(`Error loading directory: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Navigate to a directory URL (SPA-style with pushState)
  const navigateToDirectoryUrl = useCallback((url, pushState = true) => {
    if (pushState) {
      const newSearchParams = new URLSearchParams(window.location.search)
      newSearchParams.set('url', url)
      newSearchParams.set('type', 'directory')
      history.pushState({ dirUrl: url }, '', '?' + newSearchParams.toString())
    }
    fetchDirectoryListing(url)
  }, [fetchDirectoryListing])

  // Load initial directory if dirUrl is provided
  useEffect(() => {
    if (dirUrl) {
      fetchDirectoryListing(dirUrl)
    }
  }, []) // Only run once on mount

  // Handle browser back/forward in URL mode
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.dirUrl) {
        fetchDirectoryListing(e.state.dirUrl)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [fetchDirectoryListing])

  const openDirectory = useCallback(async () => {
    if (!window.showDirectoryPicker) {
      toast.error('Directory picker is not supported in this browser')
      return
    }

    try {
      setIsLoading(true)
      // Switch out of URL mode when user picks a folder manually
      setDirectoryUrl(null)

      const handle = await window.showDirectoryPicker()
      setDirectoryHandle(handle)
      setCurrentPath([{ name: handle.name, handle }])

      const entries = []
      for await (const entry of handle.values()) {
        const fileData = {
          name: entry.name,
          kind: entry.kind,
          handle: entry
        }

        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile()
            fileData.size = file.size
            fileData.modified = file.lastModified
            fileData.type = file.type
          } catch {
            // Skip files we can't read
          }
        }

        entries.push(fileData)
      }

      // Sort: directories first, then files alphabetically
      entries.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      setFiles(entries)
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(`Error opening directory: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const navigateToFolder = useCallback(async (folderHandle, folderName) => {
    try {
      setIsLoading(true)
      setSearchQuery('')
      setCurrentPath(prev => [...prev, { name: folderName, handle: folderHandle }])

      const entries = []
      for await (const entry of folderHandle.values()) {
        const fileData = {
          name: entry.name,
          kind: entry.kind,
          handle: entry
        }

        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile()
            fileData.size = file.size
            fileData.modified = file.lastModified
            fileData.type = file.type
          } catch {
            // Skip files we can't read
          }
        }

        entries.push(fileData)
      }

      entries.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      setFiles(entries)
    } catch (err) {
      toast.error(`Error navigating to folder: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const navigateToBreadcrumb = useCallback(async (index) => {
    if (index === currentPath.length - 1) return

    if (isUrlMode) {
      // URL mode: navigate to the breadcrumb's URL
      const target = currentPath[index]
      if (target.url) {
        navigateToDirectoryUrl(target.url)
      }
      return
    }

    try {
      setIsLoading(true)
      setSearchQuery('')
      const targetPath = currentPath.slice(0, index + 1)
      const targetHandle = targetPath[targetPath.length - 1].handle

      const entries = []
      for await (const entry of targetHandle.values()) {
        const fileData = {
          name: entry.name,
          kind: entry.kind,
          handle: entry
        }

        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile()
            fileData.size = file.size
            fileData.modified = file.lastModified
            fileData.type = file.type
          } catch {
            // Skip files we can't read
          }
        }

        entries.push(fileData)
      }

      entries.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      setCurrentPath(targetPath)
      setFiles(entries)
    } catch (err) {
      toast.error(`Error navigating: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [currentPath, isUrlMode, navigateToDirectoryUrl, toast])

  const handleFileClick = useCallback(async (file) => {
    if (file.kind === 'directory') {
      if (isUrlMode && file.url) {
        navigateToDirectoryUrl(file.url)
      } else if (file.handle) {
        await navigateToFolder(file.handle, file.name)
      }
      return
    }

    if (isUrlMode && file.url) {
      // In URL mode, navigate directly to the file URL
      // The extension's background.js or content.js will intercept supported types
      window.location.href = file.url
      return
    }

    // File System Access API mode
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['csv', 'json', 'txt', 'md'].includes(ext)) {
      try {
        const fileObj = await file.handle.getFile()
        onFileSelect?.(fileObj, file.handle, ext)
      } catch (err) {
        toast.error(`Error opening file: ${err.message}`)
      }
    } else {
      toast.info(`File type .${ext} is not supported yet`)
    }
  }, [isUrlMode, navigateToDirectoryUrl, navigateToFolder, onFileSelect, toast])

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter files by search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files
    const query = searchQuery.toLowerCase()
    return files.filter(file => file.name.toLowerCase().includes(query))
  }, [files, searchQuery])

  // Sort files (directories always first)
  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles]
    sorted.sort((a, b) => {
      // Directories always come first
      if (a.kind !== b.kind) {
        return a.kind === 'directory' ? -1 : 1
      }

      let comparison = 0
      switch (sortConfig.key) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'modified':
          comparison = (a.modified || 0) - (b.modified || 0)
          break
        case 'type':
          const typeA = a.kind === 'directory' ? 'Folder' : a.name.split('.').pop()?.toLowerCase() || ''
          const typeB = b.kind === 'directory' ? 'Folder' : b.name.split('.').pop()?.toLowerCase() || ''
          comparison = typeA.localeCompare(typeB)
          break
        default:
          comparison = 0
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredFiles, sortConfig])

  // Handle column header click for sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Get sort icon for column header
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'bi-chevron-expand'
    return sortConfig.direction === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'
  }

  // Handle right-click context menu
  const handleContextMenu = (e, file) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file
    })
  }

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // Context menu actions
  const handleContextMenuAction = async (action) => {
    const file = contextMenu.file
    if (!file) return

    switch (action) {
      case 'open':
        handleFileClick(file)
        break
      case 'open-new-tab':
        if (file.kind === 'file') {
          if (isUrlMode && file.url) {
            window.open(file.url, '_blank')
          } else {
            const ext = file.name.split('.').pop()?.toLowerCase()
            if (['csv', 'json', 'txt', 'md'].includes(ext)) {
              try {
                const fileObj = await file.handle.getFile()
                const blob = new Blob([await fileObj.text()], { type: fileObj.type || 'text/plain' })
                const url = URL.createObjectURL(blob)
                window.open(url, '_blank')
              } catch (err) {
                toast.error(`Error opening file: ${err.message}`)
              }
            } else {
              toast.info(`File type .${ext} is not supported yet`)
            }
          }
        }
        break
      case 'copy-path':
        if (isUrlMode) {
          // Decode the file:// URL path for a clean filesystem path
          try {
            const parsed = new URL(file.url || directoryUrl + file.name)
            const decodedPath = decodeURIComponent(parsed.pathname)
            // On Windows, remove leading slash from /C:/... paths
            const cleanPath = decodedPath.replace(/^\/([A-Za-z]:)/, '$1')
            navigator.clipboard.writeText(cleanPath)
          } catch {
            navigator.clipboard.writeText(file.url || file.name)
          }
        } else {
          const fullPath = [...currentPath.map(p => p.name), file.name].join('/')
          navigator.clipboard.writeText(fullPath)
        }
        toast.success('Path copied to clipboard')
        break
      case 'copy-name':
        navigator.clipboard.writeText(file.name)
        toast.success('Name copied to clipboard')
        break
    }
    closeContextMenu()
  }

  // Close context menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        closeContextMenu()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu.visible, closeContextMenu])

  // Clear search when navigating
  const clearSearch = () => setSearchQuery('')

  // Show empty state only when not in URL mode and no directory handle
  if (!directoryHandle && !directoryUrl) {
    return (
      <>
        <Header onOpenFile={openDirectory} />
        <main className="main-content">
          <div className="empty-state">
            <div className="empty-icon"><i className="bi bi-folder2-open"></i></div>
            <div className="empty-title">File Browser</div>
            <div className="empty-description">
              Browse and open files from your local filesystem. Select a folder to get started.
            </div>
            <button className="btn btn-primary" onClick={openDirectory}>
              <i className="bi bi-folder2-open"></i> Open Folder
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header onOpenFile={openDirectory}>
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => { setViewMode('list'); localStorage.setItem('fileBrowser-viewMode', 'list') }}
            title="List view"
          >
            <i className="bi bi-list"></i>
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => { setViewMode('grid'); localStorage.setItem('fileBrowser-viewMode', 'grid') }}
            title="Grid view"
          >
            <i className="bi bi-grid"></i>
          </button>
        </div>
      </Header>
      <main className="main-content">
        <div className="browser-container">
          <div className="breadcrumb">
            {currentPath.map((item, index) => (
              <span key={index} style={{ display: 'contents' }}>
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                <span
                  className={`breadcrumb-item ${index === currentPath.length - 1 ? 'current' : ''}`}
                  onClick={() => navigateToBreadcrumb(index)}
                >
                  {index === 0 && <i className="bi bi-folder2"></i>}
                  {item.name}
                </span>
              </span>
            ))}
          </div>

          <div className="browser-controls">
            <div className="browser-search">
              <div className="browser-search-wrapper">
                <i className="bi bi-search browser-search-icon"></i>
                <input
                  type="text"
                  className="browser-search-input"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn"
                    style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '4px 8px', minWidth: 'auto' }}
                    onClick={clearSearch}
                    title="Clear search"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="browser-loading">
              <div className="browser-loading-spinner"></div>
              <div className="browser-loading-text">Loading...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="browser-empty">
              <div className="browser-empty-icon"><i className="bi bi-folder-x"></i></div>
              <div className="browser-empty-title">Empty Folder</div>
              <div className="browser-empty-description">This folder doesn't contain any files.</div>
            </div>
          ) : (
            <>
              {viewMode === 'list' && (
                <div className="file-list-header">
                  <span onClick={() => handleSort('name')}>
                    Name
                    <i className={`bi ${getSortIcon('name')} sort-icon ${sortConfig.key === 'name' ? 'active' : ''}`}></i>
                  </span>
                  <span onClick={() => handleSort('size')}>
                    Size
                    <i className={`bi ${getSortIcon('size')} sort-icon ${sortConfig.key === 'size' ? 'active' : ''}`}></i>
                  </span>
                  <span onClick={() => handleSort('modified')}>
                    Modified
                    <i className={`bi ${getSortIcon('modified')} sort-icon ${sortConfig.key === 'modified' ? 'active' : ''}`}></i>
                  </span>
                  <span onClick={() => handleSort('type')}>
                    Type
                    <i className={`bi ${getSortIcon('type')} sort-icon ${sortConfig.key === 'type' ? 'active' : ''}`}></i>
                  </span>
                </div>
              )}
              {sortedFiles.length === 0 && searchQuery ? (
                <div className="browser-empty">
                  <div className="browser-empty-icon"><i className="bi bi-search"></i></div>
                  <div className="browser-empty-title">No Results</div>
                  <div className="browser-empty-description">
                    No files match "{searchQuery}". Try a different search term.
                  </div>
                  <button className="btn btn-primary" onClick={clearSearch}>
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className={`file-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                  {sortedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="file-item"
                      onClick={() => handleFileClick(file)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                      <div className="file-item-name">
                        <i className={`bi file-icon ${getFileIcon(file)}`}></i>
                        <span title={file.name}>{file.name}</span>
                      </div>
                      <div className="file-item-size">
                        {file.kind === 'file' ? formatFileSize(file.size || 0) : '-'}
                      </div>
                      <div className="file-item-modified">
                        {formatDate(file.modified)}
                      </div>
                      <div className="file-item-type">
                        {file.kind === 'directory' ? 'Folder' : file.name.split('.').pop()?.toUpperCase() || 'File'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Context Menu */}
          {contextMenu.visible && (
            <div
              ref={contextMenuRef}
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="context-menu-item" onClick={() => handleContextMenuAction('open')}>
                <i className="bi bi-folder2-open context-menu-item-icon"></i>
                Open
              </div>
              {contextMenu.file?.kind === 'file' && (
                <div className="context-menu-item" onClick={() => handleContextMenuAction('open-new-tab')}>
                  <i className="bi bi-box-arrow-up-right context-menu-item-icon"></i>
                  Open in New Tab
                </div>
              )}
              <div className="context-menu-separator"></div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('copy-path')}>
                <i className="bi bi-clipboard context-menu-item-icon"></i>
                Copy Path
              </div>
              <div className="context-menu-item" onClick={() => handleContextMenuAction('copy-name')}>
                <i className="bi bi-type context-menu-item-icon"></i>
                Copy Name
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
