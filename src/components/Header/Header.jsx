import { useContext, useMemo } from 'react'
import { FileContext } from '../../context/FileContext'
import { Breadcrumb } from '../Breadcrumb/Breadcrumb'
import './Header.css'

export function Header({
  onSave,
  onExport,
  onAnalyze,
  showSave = false,
  showExport = false,
  showAnalyze = false,
  stats = null,
  children
}) {
  const { filename, isModified, fileHandle } = useContext(FileContext)

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

  const canSave = showSave && fileHandle

  return (
    <>
    <header className="header">
      <div className="header-left">
        <a href={`${window.location.pathname}?type=directory`} className="logo logo-link">FileLens</a>
        {parentDirUrl && (
          <a href={parentDirUrl} className="btn btn-outline back-btn" title="Back to folder">
            <i className="bi bi-arrow-left"></i>
          </a>
        )}
      </div>
      <div className="header-right">
        {stats && (
          <div className="stats">
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
        {showAnalyze && (
          <button className="btn btn-outline ai-analyze-btn" onClick={onAnalyze} title="AI Insights">
            <i className="bi bi-stars"></i>
          </button>
        )}
        <a
          href={`${window.location.pathname}?type=settings`}
          className="btn btn-outline settings-gear-btn"
          title="Settings"
        >
          <i className="bi bi-gear"></i>
        </a>
      </div>
    </header>
    <Breadcrumb items={breadcrumbs} />
    </>
  )
}
