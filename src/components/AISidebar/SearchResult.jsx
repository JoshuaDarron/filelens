export function SearchResult({ result, onClick }) {
  const scorePercent = Math.round(result.score * 100)

  return (
    <div className="ai-search-result" onClick={() => onClick?.(result)}>
      <div className="ai-search-result-header">
        <span className="ai-search-result-location">
          <i className="bi bi-geo-alt"></i>
          {result.location}
        </span>
        <span className={`ai-search-result-score ${scorePercent >= 70 ? 'high' : scorePercent >= 40 ? 'medium' : 'low'}`}>
          {scorePercent}%
        </span>
      </div>
      <p className="ai-search-result-text">{result.text}</p>
    </div>
  )
}
