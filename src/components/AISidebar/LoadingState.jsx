export function LoadingState({ message = 'Analyzing...' }) {
  return (
    <div className="ai-loading-state">
      <div className="ai-loading-spinner"></div>
      <p>{message}</p>
    </div>
  )
}
