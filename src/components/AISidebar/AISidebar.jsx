import './AISidebar.css'

export function AISidebar({ isOpen, onClose, children }) {
  return (
    <div className={`ai-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="ai-sidebar-header">
        <div className="ai-sidebar-tabs">
          <button className="ai-sidebar-tab active">
            <i className="bi bi-search"></i>
            Search
          </button>
        </div>
        <button className="ai-sidebar-close" onClick={onClose} title="Close panel">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className="ai-sidebar-body">
        {children || (
          <div className="ai-sidebar-empty">
            <i className="bi bi-stars"></i>
            <p>Click <strong>Analyze</strong> to search this file with AI.</p>
          </div>
        )}
      </div>
    </div>
  )
}
