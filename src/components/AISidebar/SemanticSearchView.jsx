import { useState, useEffect, useCallback, useRef } from 'react'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { SearchResult } from './SearchResult'
import { chunkForSearch, buildSearchIndex, searchIndex } from '../../services/ai/semanticSearch'
import { getModelStatus } from '../../services/ai/embeddingService'

export function SemanticSearchView({ fileData, fileType, onResultClick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [index, setIndex] = useState(null)
  const [indexing, setIndexing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  const modelReady = getModelStatus() === 'ready'

  // Build index on mount if model is ready
  useEffect(() => {
    if (!modelReady || !fileData || index) return

    let cancelled = false

    const buildIndex = async () => {
      setIndexing(true)
      setError(null)

      const chunks = chunkForSearch(fileData, fileType)
      if (chunks.length === 0) {
        setIndexing(false)
        setError('No content to index')
        return
      }

      const { index: builtIndex, error: indexError } = await buildSearchIndex(chunks)

      if (cancelled) return

      setIndexing(false)
      if (indexError) {
        setError(indexError)
      } else {
        setIndex(builtIndex)
      }
    }

    buildIndex()
    return () => { cancelled = true }
  }, [modelReady, fileData, fileType]) // eslint-disable-line react-hooks/exhaustive-deps

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
    return <LoadingState message="Building search index..." />
  }

  if (error && !index) {
    return <ErrorState message={error} />
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
