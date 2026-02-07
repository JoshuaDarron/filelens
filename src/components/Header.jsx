import { useContext, useMemo, useRef } from 'react'
import { FileContext } from '../context/FileContext'
import { ThemeToggle } from './ThemeToggle'

export function Header({
  onOpenFile,
  onSave,
  onExport,
  showSave = false,
  showExport = false,
  stats = null,
  children
}) {
  const { filename, isModified, fileHandle } = useContext(FileContext)
  const fileInputRef = useRef(null)

  const { parentDirUrl, breadcrumbs } = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const fileUrl = params.get('url')
    const type = params.get('type')
    if (!fileUrl || type === 'directory') return { parentDirUrl: null, breadcrumbs: null }
    try {
      const parsed = new URL(fileUrl)
      if (parsed.protocol !== 'file:') return { parentDirUrl: null, breadcrumbs: null }

      const pathname = decodeURIComponent(parsed.pathname)
      const segments = pathname.split('/').filter(Boolean)
      const crumbs = []

      // Directory segments (all but the last, which is the filename)
      for (let i = 0; i < segments.length - 1; i++) {
        const pathUpTo = '/' + segments.slice(0, i + 1).join('/') + '/'
        const dirUrl = `file://${pathUpTo}`
        crumbs.push({
          name: segments[i],
          url: `${window.location.pathname}?url=${encodeURIComponent(dirUrl)}&type=directory`
        })
      }

      // Filename as last segment (no url — not clickable)
      if (segments.length > 0) {
        crumbs.push({ name: segments[segments.length - 1], url: null })
      }

      const parentPath = parsed.pathname.replace(/\/[^/]+$/, '/')
      const parentUrl = `file://${parentPath}`
      const parentViewerUrl = `${window.location.pathname}?url=${encodeURIComponent(parentUrl)}&type=directory`

      return { parentDirUrl: parentViewerUrl, breadcrumbs: crumbs }
    } catch {
      return { parentDirUrl: null, breadcrumbs: null }
    }
  }, [])

  const handleOpenClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const canSave = showSave && fileHandle

  return (
    <>
    <header className="header">
      <div className="header-left">
        <div className="logo">FileLens</div>
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          accept="*/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && onOpenFile) {
              onOpenFile(file)
            }
          }}
        />
        <button className="btn btn-primary" onClick={handleOpenClick}>
          <i className="bi bi-folder2-open"></i> Open
        </button>
        {parentDirUrl && (
          <a href={parentDirUrl} className="btn btn-outline back-btn" title="Back to folder">
            <i className="bi bi-arrow-left"></i>
          </a>
        )}
        {filename && (
          <div className="file-info">
            <span><i className="bi bi-file-earmark-text"></i> {filename}</span>
          </div>
        )}
      </div>
      <div className="header-right">
        {stats && (
          <div className="stats" style={{ display: 'flex' }}>
            {stats.rows !== undefined && (
              <div className="stat">
                <i className="bi bi-bar-chart-steps"></i>
                <span>{stats.rows} rows</span>
              </div>
            )}
            {stats.cols !== undefined && (
              <div className="stat">
                <i className="bi bi-columns-gap"></i>
                <span>{stats.cols} columns</span>
              </div>
            )}
            {stats.lines !== undefined && (
              <div className="stat">
                <i className="bi bi-text-left"></i>
                <span>{stats.lines} lines</span>
              </div>
            )}
            {stats.size !== undefined && (
              <div className="stat">
                <i className="bi bi-hdd"></i>
                <span>{stats.size}</span>
              </div>
            )}
            {isModified && (
              <div className="stat">
                <i className="bi bi-pencil-square"></i>
                <span>Modified</span>
              </div>
            )}
          </div>
        )}
        {canSave && (
          <button className="btn btn-primary" onClick={onSave}>
            <i className="bi bi-floppy"></i> Save
          </button>
        )}
        {showExport && (
          <button className="btn btn-success" onClick={onExport}>
            <i className="bi bi-download"></i> Export
          </button>
        )}
        {children}
        <ThemeToggle />
      </div>
    </header>
    {breadcrumbs && (
      <div className="breadcrumb">
        {breadcrumbs.map((item, index) => (
          <span key={index} style={{ display: 'contents' }}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {item.url ? (
              <a
                className="breadcrumb-item"
                href={item.url}
              >
                {index === 0 && <i className="bi bi-folder2"></i>}
                {item.name}
              </a>
            ) : (
              <span className="breadcrumb-item current">
                {item.name}
              </span>
            )}
          </span>
        ))}
      </div>
    )}
    </>
  )
}
