import { useState } from 'react'
import './AISidebar.css'

export function AISidebar({ isOpen, onClose, children, insightsContent }) {
  const [activeTab, setActiveTab] = useState('search')
  const hasTabs = !!insightsContent

  return (
    <div className={`ai-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="ai-sidebar-header">
        <div className="ai-sidebar-tabs">
          <button
            className={`ai-sidebar-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <i className="bi bi-search"></i>
            Search
          </button>
          {hasTabs && (
            <button
              className={`ai-sidebar-tab ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              <i className="bi bi-lightbulb"></i>
              Insights
            </button>
          )}
        </div>
        <button className="ai-sidebar-close" onClick={onClose} title="Close panel">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className="ai-sidebar-body">
        {activeTab === 'search' && (
          children || (
            <div className="ai-sidebar-empty">
              <i className="bi bi-stars"></i>
              <p>Click <strong>Analyze</strong> to search this file with AI.</p>
            </div>
          )
        )}
        {activeTab === 'insights' && insightsContent}
      </div>
    </div>
  )
}
