import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { DiffView } from './DiffView'

export function SuggestionView({ suggestions, isLoading, error, onRetry, onDismiss }) {
  if (isLoading) {
    return <LoadingState message="Generating suggestions..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="ai-sidebar-empty">
        <i className="bi bi-lightbulb"></i>
        <p>Click <strong>Analyze</strong> to get AI-powered edit suggestions.</p>
      </div>
    )
  }

  return (
    <div className="ai-suggestions-view">
      {suggestions.map((suggestion, i) => (
        <div key={i} className="ai-suggestion-card">
          <div className="ai-suggestion-header">
            <span className="ai-suggestion-title">
              <i className="bi bi-lightbulb"></i>
              {suggestion.title}
            </span>
            {onDismiss && (
              <button className="ai-suggestion-dismiss" onClick={() => onDismiss(i)} title="Dismiss">
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
          <p className="ai-suggestion-issue">{suggestion.issue}</p>
          {(suggestion.before || suggestion.after) && (
            <DiffView before={suggestion.before} after={suggestion.after} />
          )}
        </div>
      ))}
    </div>
  )
}
