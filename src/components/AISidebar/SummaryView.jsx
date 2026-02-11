import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'

export function SummaryView({ summary, isLoading, error, onRetry }) {
  if (isLoading) {
    return <LoadingState message="Generating summary..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (!summary) {
    return (
      <div className="ai-sidebar-empty">
        <i className="bi bi-card-text"></i>
        <p>Click <strong>Analyze</strong> to generate a summary of this file.</p>
      </div>
    )
  }

  return (
    <div className="ai-summary-view">
      <div className="ai-summary-text">{summary}</div>
    </div>
  )
}
