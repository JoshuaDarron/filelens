import { useState, useCallback, useRef } from 'react'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { SearchResult } from './SearchResult'
import { searchIndex } from '../../services/ai/semanticSearch'
import { getModelStatus } from '../../services/ai/embeddingService'

export function SemanticSearchView({ index, indexing, indexProgress, indexError, onResultClick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  const modelReady = getModelStatus() === 'ready'

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || !index) {
      setResults([])
      return
    }

    setSearching(true)
    const { results: searchResults, error: searchError } = await searchIndex(index, searchQuery)
    setSearching(false)

    if (searchError) {
      setError(searchError)
    } else {
      setResults(searchResults)
    }
  }, [index])

  const handleQueryChange = useCallback((e) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(value), 300)
  }, [handleSearch])

  if (!modelReady) {
    return (
      <div className="ai-sidebar-empty">
        <i className="bi bi-search"></i>
        <p>Download the embedding model in <strong>Settings</strong> to enable semantic search.</p>
      </div>
    )
  }

  if (indexing) {
    const pct = Math.round(indexProgress * 100)
    return (
      <div className="ai-loading-state">
        <div className="ai-loading-spinner"></div>
        <p>Building search index... {pct}%</p>
        <div className="ai-progress-bar">
          <div className="ai-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  if (indexError && !index) {
    return <ErrorState message={indexError} />
  }

  return (
    <div className="ai-search-view">
      <div className="ai-search-input-wrapper">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="ai-search-input"
          placeholder="Search by meaning..."
          value={query}
          onChange={handleQueryChange}
          autoFocus
        />
        {query && (
          <button className="ai-search-clear" onClick={() => { setQuery(''); setResults([]) }}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {searching && <LoadingState message="Searching..." />}

      {!searching && results.length > 0 && (
        <div className="ai-search-results">
          <div className="ai-search-results-count">{results.length} results</div>
          {results.map((result, i) => (
            <SearchResult key={i} result={result} onClick={onResultClick} />
          ))}
        </div>
      )}

      {!searching && query && results.length === 0 && (
        <div className="ai-sidebar-empty">
          <i className="bi bi-search"></i>
          <p>No results found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
