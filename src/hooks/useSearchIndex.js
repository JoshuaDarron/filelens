import { useState, useEffect, useRef } from 'react'
import { chunkForSearch, buildSearchIndex } from '../services/ai/semanticSearch'
import { getModelStatus } from '../services/ai/embeddingService'
import { useAISettings } from './useAISettings'

export function useSearchIndex(fileData, fileType) {
  const { aiEnabled } = useAISettings()
  const [index, setIndex] = useState(null)
  const [indexing, setIndexing] = useState(false)
  const [indexProgress, setIndexProgress] = useState(0)
  const [error, setError] = useState(null)
  const buildingRef = useRef(false)

  const modelReady = getModelStatus() === 'ready'

  useEffect(() => {
    if (!aiEnabled || !modelReady || !fileData || index || buildingRef.current) return

    buildingRef.current = true
    let cancelled = false

    const buildIndex = async () => {
      setIndexing(true)
      setIndexProgress(0)
      setError(null)

      const chunks = chunkForSearch(fileData, fileType)
      if (chunks.length === 0) {
        setIndexing(false)
        buildingRef.current = false
        setError('No content to index')
        return
      }

      const { index: builtIndex, error: indexError } = await buildSearchIndex(chunks, (progress) => {
        if (!cancelled) setIndexProgress(progress)
      })

      if (cancelled) {
        buildingRef.current = false
        return
      }

      setIndexing(false)
      buildingRef.current = false
      if (indexError) {
        setError(indexError)
      } else {
        setIndex(builtIndex)
      }
    }

    buildIndex()
    return () => { cancelled = true }
  }, [aiEnabled, modelReady, fileData, fileType]) // eslint-disable-line react-hooks/exhaustive-deps

  return { index, indexing, indexProgress, error }
}
