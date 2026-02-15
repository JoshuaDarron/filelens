import { createContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useAISettings } from '../hooks/useAISettings'
import { checkEmbeddingAvailability, loadEmbeddingModel as loadModel, clearModelCache } from '../services/ai/embeddingService'
import { checkLLMAvailability, loadLLM as loadLLMService } from '../services/ai/llmService'

export const AIContext = createContext(null)

// Status: 'idle' | 'checking' | 'ready' | 'needs-download' | 'needs-load' | 'downloading' | 'loading' | 'unavailable' | 'error'
const initialStatus = {
  status: 'idle',
  message: '',
}

const initialLLMStatus = {
  status: 'idle',
  message: '',
  progress: 0,
}

export function AIProvider({ children }) {
  const { aiEnabled } = useAISettings()
  const [embeddingStatus, setEmbeddingStatus] = useState(initialStatus)
  const [llmStatus, setLLMStatus] = useState(initialLLMStatus)
  const [llmCapabilities, setLLMCapabilities] = useState(null)

  const isAIReady = aiEnabled && embeddingStatus.status === 'ready'
  const isLLMReady = aiEnabled && llmStatus.status === 'ready'

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

  const detectLLMCapabilities = useCallback(async () => {
    const result = await checkLLMAvailability()
    setLLMCapabilities(result)
    return result
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

  const handleLoadLLM = useCallback(async (modelId) => {
    setLLMStatus({ status: 'loading', message: 'Initializing...', progress: 0 })

    const result = await loadLLMService(modelId, (progress) => {
      setLLMStatus({
        status: 'loading',
        message: progress.text || 'Loading model...',
        progress: progress.progress || 0,
      })
    })

    if (result.success) {
      setLLMStatus({ status: 'ready', message: 'Model loaded', progress: 1 })
    } else {
      setLLMStatus({ status: 'error', message: result.error || 'Failed to load model', progress: 0 })
    }
  }, [])

  useEffect(() => {
    if (aiEnabled) {
      detectCapabilities()
      detectLLMCapabilities()
    } else {
      setEmbeddingStatus(initialStatus)
      setLLMStatus(initialLLMStatus)
      setLLMCapabilities(null)
      clearModelCache()
    }
  }, [aiEnabled, detectCapabilities, detectLLMCapabilities])

  const contextValue = useMemo(() => ({
    embeddingStatus,
    isAIReady,
    detectCapabilities,
    loadEmbeddingModel: handleLoadEmbeddingModel,
    llmStatus,
    isLLMReady,
    llmCapabilities,
    loadLLM: handleLoadLLM,
    detectLLMCapabilities,
  }), [embeddingStatus, isAIReady, detectCapabilities, handleLoadEmbeddingModel, llmStatus, isLLMReady, llmCapabilities, handleLoadLLM, detectLLMCapabilities])

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  )
}
