import { memo, useContext, useMemo } from 'react'
import { FileContext } from '../../context/FileContext'
import { HeaderContext } from '../../context/HeaderContext'
import './Navbar.css'

export const Navbar = memo(function Navbar() {
  const { fileHandle, isModified } = useContext(FileContext)
  const { config, callbacksRef } = useContext(HeaderContext)
  const { visible, showSave, showExport, showAnalyze, stats, toolbarContent } = config

  const parentDirUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const fileUrl = params.get('url')
    const type = params.get('type')
    if (!fileUrl || type === 'directory') return null
    try {
      const parsed = new URL(fileUrl)
      if (parsed.protocol !== 'file:') return null
      const parentPath = parsed.pathname.replace(/\/[^/]+$/, '/')
      const parentUrl = `file://${parentPath}`
      return `${window.location.pathname}?url=${encodeURIComponent(parentUrl)}&type=directory`
    } catch {
      return null
    }
  }, [])

  if (!visible) return null

  const canSave = showSave && fileHandle

  return (
    <header className="header">
      <div className="header-left">
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
          <button className="btn btn-primary" onClick={() => callbacksRef.current.onSave?.()}>
            <i className="bi bi-floppy"></i> Save
          </button>
        )}
        {showExport && (
          <button className="btn btn-success" onClick={() => callbacksRef.current.onExport?.()}>
            <i className="bi bi-download"></i> Export
          </button>
        )}
        {toolbarContent}
        {showAnalyze && (
          <button className="btn btn-outline ai-analyze-btn" onClick={() => callbacksRef.current.onAnalyze?.()} title="AI Insights">
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
  )
})
