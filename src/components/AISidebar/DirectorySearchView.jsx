import { useState, useCallback, useRef } from 'react'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { SearchResult } from './SearchResult'
import { indexDirectory, searchDirectory } from '../../services/ai/directorySearch'
import { getModelStatus } from '../../services/ai/embeddingService'

export function DirectorySearchView({ files, onFileClick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [index, setIndex] = useState(null)
  const [indexing, setIndexing] = useState(false)
  const [indexProgress, setIndexProgress] = useState(0)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [indexedFileCount, setIndexedFileCount] = useState(0)
  const debounceRef = useRef(null)

  const modelReady = getModelStatus() === 'ready'

  const handleBuildIndex = useCallback(async () => {
    setIndexing(true)
    setError(null)
    setIndexProgress(0)

    const { index: builtIndex, fileCount } = await indexDirectory(files, (progress) => {
      setIndexProgress(progress)
    })

    setIndexing(false)
    if (builtIndex.length === 0) {
      setError('No supported files found to index (CSV, JSON, TXT, MD)')
    } else {
      setIndex(builtIndex)
      setIndexedFileCount(fileCount)
    }
  }, [files])

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || !index) {
      setResults([])
      return
    }

    setSearching(true)
    const { results: searchResults, error: searchError } = await searchDirectory(index, searchQuery)
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

  const handleResultClick = useCallback((result) => {
    if (result.fileUrl) {
      window.location.href = result.fileUrl
    } else if (onFileClick) {
      onFileClick(result)
    }
  }, [onFileClick])

  if (!modelReady) {
    return (
      <div className="ai-sidebar-empty">
        <i className="bi bi-search"></i>
        <p>Download the embedding model in <strong>Settings</strong> to enable semantic file search.</p>
      </div>
    )
  }

  if (indexing) {
    return (
      <div className="ai-loading-state">
        <div className="ai-loading-spinner"></div>
        <p>Indexing files... {Math.round(indexProgress * 100)}%</p>
        <div className="ai-progress-bar">
          <div className="ai-progress-fill" style={{ width: `${indexProgress * 100}%` }}></div>
        </div>
      </div>
    )
  }

  if (error && !index) {
    return <ErrorState message={error} onRetry={handleBuildIndex} />
  }

  if (!index) {
    return (
      <div className="ai-sidebar-empty">
        <i className="bi bi-folder-symlink"></i>
        <p>Index this directory to search across all supported files by meaning.</p>
        <button className="btn btn-primary btn-sm" onClick={handleBuildIndex}>
          <i className="bi bi-lightning"></i> Index Directory
        </button>
      </div>
    )
  }

  return (
    <div className="ai-search-view">
      <div className="ai-search-meta">
        {indexedFileCount} files indexed ({index.length} chunks)
      </div>
      <div className="ai-search-input-wrapper">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="ai-search-input"
          placeholder="Search files by meaning..."
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
          <div className="ai-search-results-count">{results.length} files</div>
          {results.map((result, i) => (
            <div key={i} className="ai-search-result" onClick={() => handleResultClick(result)}>
              <div className="ai-search-result-header">
                <span className="ai-search-result-location">
                  <i className="bi bi-file-earmark"></i>
                  {result.fileName}
                </span>
                <span className={`ai-search-result-score ${Math.round(result.score * 100) >= 70 ? 'high' : Math.round(result.score * 100) >= 40 ? 'medium' : 'low'}`}>
                  {Math.round(result.score * 100)}%
                </span>
              </div>
              <p className="ai-search-result-text">{result.text}</p>
            </div>
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
