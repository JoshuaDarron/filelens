import { memo, useMemo } from 'react'
import './Navbar.css'

export const Navbar = memo(function Navbar() {
  const { parentDirUrl, isSettings } = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const fileUrl = params.get('url')
    const type = params.get('type')
    if (type === 'settings') return { parentDirUrl: null, isSettings: true }
    if (!fileUrl || type === 'directory') return { parentDirUrl: null, isSettings: false }
    try {
      const parsed = new URL(fileUrl)
      if (parsed.protocol !== 'file:') return { parentDirUrl: null, isSettings: false }
      const parentPath = parsed.pathname.replace(/\/[^/]+$/, '/')
      const parentUrl = `file://${parentPath}`
      return {
        parentDirUrl: `${window.location.pathname}?url=${encodeURIComponent(parentUrl)}&type=directory`,
        isSettings: false,
      }
    } catch {
      return { parentDirUrl: null, isSettings: false }
    }
  }, [])

  return (
    <header className="navbar">
      <div className="navbar-left">
        {parentDirUrl && (
          <a href={parentDirUrl} className="btn btn-outline back-btn" title="Back to folder">
            <i className="bi bi-arrow-left"></i>
          </a>
        )}
        {isSettings && (
          <button
            className="btn btn-outline back-btn"
            title="Back"
            onClick={() => window.history.length > 1 ? window.history.back() : (window.location.search = '?type=directory')}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
        )}
      </div>
      <div className="navbar-right">
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
