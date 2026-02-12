import { createContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useAISettings } from '../hooks/useAISettings'
import { checkEmbeddingAvailability, loadEmbeddingModel as loadModel, clearModelCache } from '../services/ai/embeddingService'

export const AIContext = createContext(null)

// Status: 'idle' | 'checking' | 'ready' | 'needs-download' | 'needs-load' | 'downloading' | 'loading' | 'unavailable' | 'error'
const initialStatus = {
  status: 'idle',
  message: '',
}

export function AIProvider({ children }) {
  const { aiEnabled } = useAISettings()
  const [embeddingStatus, setEmbeddingStatus] = useState(initialStatus)

  const isAIReady = aiEnabled && embeddingStatus.status === 'ready'

  const detectCapabilities = useCallback(async () => {
    setEmbeddingStatus({ status: 'checking', message: 'Checking availability...' })

    const embeddingResult = await checkEmbeddingAvailability()

    // Embedding: small model, safe to auto-load from cache
    if (embeddingResult.status === 'needs-load') {
      setEmbeddingStatus({ status: 'loading', message: 'Loading model...' })
      const loadResult = await loadModel()
      if (loadResult.success) {
        setEmbeddingStatus({ status: 'ready', message: 'Available' })
      } else {
        setEmbeddingStatus({ status: 'error', message: loadResult.error })
      }
    } else {
      setEmbeddingStatus({ status: embeddingResult.status, message: embeddingResult.message })
    }
  }, [])

  const handleLoadEmbeddingModel = useCallback(async () => {
    setEmbeddingStatus({ status: 'loading', message: 'Loading model...' })
    const result = await loadModel((progress) => {
      setEmbeddingStatus({ status: 'loading', message: `Downloading... ${Math.round(progress * 100)}%` })
    })
    if (result.success) {
      setEmbeddingStatus({ status: 'ready', message: 'Available' })
    } else {
      setEmbeddingStatus({ status: 'error', message: result.error })
    }
  }, [])

  useEffect(() => {
    if (aiEnabled) {
      detectCapabilities()
    } else {
      setEmbeddingStatus(initialStatus)
      clearModelCache()
    }
  }, [aiEnabled, detectCapabilities])

  const contextValue = useMemo(() => ({
    embeddingStatus,
    isAIReady,
    detectCapabilities,
    loadEmbeddingModel: handleLoadEmbeddingModel,
  }), [embeddingStatus, isAIReady, detectCapabilities, handleLoadEmbeddingModel])

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  )
}
