import { useEffect } from 'react'
import './AISidebar.css'

export function AISidebar({ isOpen, onClose, activeTab, onTabChange, promptReady, children }) {
  // If active tab requires prompt API but it's not available, fall back to search
  useEffect(() => {
    if (!promptReady && (activeTab === 'summary' || activeTab === 'suggestions')) {
      onTabChange('search')
    }
  }, [promptReady, activeTab, onTabChange])

  return (
    <div className={`ai-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="ai-sidebar-header">
        <div className="ai-sidebar-tabs">
          {promptReady && (
            <button
              className={`ai-sidebar-tab ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => onTabChange('summary')}
            >
              <i className="bi bi-card-text"></i>
              Summary
            </button>
          )}
          <button
            className={`ai-sidebar-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => onTabChange('search')}
          >
            <i className="bi bi-search"></i>
            Search
          </button>
          {promptReady && (
            <button
              className={`ai-sidebar-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => onTabChange('suggestions')}
            >
              <i className="bi bi-lightbulb"></i>
              Suggestions
            </button>
          )}
        </div>
        <button className="ai-sidebar-close" onClick={onClose} title="Close panel">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className="ai-sidebar-body">
        {children || (
          <div className="ai-sidebar-empty">
            <i className="bi bi-stars"></i>
            <p>Click <strong>Analyze</strong> to generate AI insights for this file.</p>
          </div>
        )}
      </div>
    </div>
  )
}
