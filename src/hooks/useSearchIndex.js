import { useState, useEffect, useRef } from 'react'
import { chunkForSearch, buildSearchIndex } from '../services/ai/semanticSearch'
import { getModelStatus } from '../services/ai/embeddingService'
import { getCachedIndex, setCachedIndex, hashForIndex } from '../services/ai/indexCache'
import { useAISettings } from './useAISettings'

export function useSearchIndex(fileData, fileType, shouldBuild = true) {
  const { aiEnabled } = useAISettings()
  const [index, setIndex] = useState(null)
  const [indexing, setIndexing] = useState(false)
  const [indexProgress, setIndexProgress] = useState(0)
  const [error, setError] = useState(null)
  const buildingRef = useRef(false)

  const modelReady = getModelStatus() === 'ready'

  useEffect(() => {
    if (!aiEnabled || !modelReady || !fileData || !shouldBuild || index || buildingRef.current) return

    buildingRef.current = true
    let cancelled = false

    const buildIndex = async () => {
      setIndexing(true)
      setIndexProgress(0)
      setError(null)

      // Check cache first
      try {
        const contentHash = await hashForIndex(fileData)
        const cached = await getCachedIndex(contentHash)
        if (cached && !cancelled) {
          setIndex(cached)
          setIndexing(false)
          buildingRef.current = false
          return
        }
      } catch {
        // Cache miss or error, proceed with building
      }

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
        // Store in cache
        try {
          const contentHash = await hashForIndex(fileData)
          await setCachedIndex(contentHash, builtIndex)
        } catch {
          // Cache write failure is non-critical
        }
      }
    }

    buildIndex()
    return () => { cancelled = true }
  }, [aiEnabled, modelReady, fileData, fileType, shouldBuild]) // eslint-disable-line react-hooks/exhaustive-deps

  return { index, indexing, indexProgress, error }
}
