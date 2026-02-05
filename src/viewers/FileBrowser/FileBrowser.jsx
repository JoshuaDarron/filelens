import { useState, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { Header } from '../../components/Header'
import { formatFileSize } from '../../utils/fileHelpers'

export function FileBrowser({ onFileSelect }) {
  const toast = useToast()
  const [files, setFiles] = useState([])
  const [currentPath, setCurrentPath] = useState([])
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [isLoading, setIsLoading] = useState(false)
  const [directoryHandle, setDirectoryHandle] = useState(null)

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

  const openDirectory = useCallback(async () => {
    if (!window.showDirectoryPicker) {
      toast.error('Directory picker is not supported in this browser')
      return
    }

    try {
      setIsLoading(true)
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

    try {
      setIsLoading(true)
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
  }, [currentPath, toast])

  const handleFileClick = useCallback(async (file) => {
    if (file.kind === 'directory') {
      await navigateToFolder(file.handle, file.name)
      return
    }

    // Open supported file types
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
  }, [navigateToFolder, onFileSelect, toast])

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

  if (!directoryHandle) {
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
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <i className="bi bi-list"></i>
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
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
                  <span>Name</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span>Type</span>
                </div>
              )}
              <div className={`file-list ${viewMode === 'grid' ? 'grid-view' : ''}`}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="file-item"
                    onClick={() => handleFileClick(file)}
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
            </>
          )}
        </div>
      </main>
    </>
  )
}
