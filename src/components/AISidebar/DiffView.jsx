export function DiffView({ before, after }) {
  if (!before && !after) return null

  return (
    <div className="ai-diff-view">
      {before && (
        <div className="ai-diff-line ai-diff-remove">
          <span className="ai-diff-marker">-</span>
          <span>{before}</span>
        </div>
      )}
      {after && (
        <div className="ai-diff-line ai-diff-add">
          <span className="ai-diff-marker">+</span>
          <span>{after}</span>
        </div>
      )}
    </div>
  )
}
