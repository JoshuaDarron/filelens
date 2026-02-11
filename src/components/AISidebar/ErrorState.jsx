export function ErrorState({ message, onRetry }) {
  return (
    <div className="ai-error-state">
      <i className="bi bi-exclamation-triangle"></i>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-primary btn-sm" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise"></i> Retry
        </button>
      )}
    </div>
  )
}
