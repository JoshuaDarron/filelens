import { createContext, useState, useCallback, useEffect } from 'react'
import { useAISettings } from '../hooks/useAISettings'
import { checkWebGPUAvailability, loadEngine, prompt, unloadEngine } from '../services/ai/webllmService'
import { checkEmbeddingAvailability, loadEmbeddingModel as loadModel, clearModelCache } from '../services/ai/embeddingService'

export const AIContext = createContext(null)

// Status: 'idle' | 'checking' | 'ready' | 'needs-download' | 'needs-load' | 'downloading' | 'loading' | 'unavailable' | 'error'
const initialStatus = {
  status: 'idle',
  message: '',
}

export function AIProvider({ children }) {
  const { aiEnabled, selectedModel } = useAISettings()
  const [promptStatus, setPromptStatus] = useState(initialStatus)
  const [embeddingStatus, setEmbeddingStatus] = useState(initialStatus)

  const isAIReady = aiEnabled && (promptStatus.status === 'ready' || embeddingStatus.status === 'ready')

  const detectCapabilities = useCallback(async () => {
    setPromptStatus({ status: 'checking', message: 'Checking availability...' })
    setEmbeddingStatus({ status: 'checking', message: 'Checking availability...' })

    const promptResult = await checkWebGPUAvailability(selectedModel)

    // Auto-load the LLM from cache so it's ready immediately after page reload
    if (promptResult.status === 'needs-load') {
      setPromptStatus({ status: 'loading', message: 'Loading model...' })
      const loadResult = await loadEngine(selectedModel)
      if (loadResult.success) {
        setPromptStatus({ status: 'ready', message: 'Available' })
      } else {
        setPromptStatus({ status: 'error', message: loadResult.error })
      }
    } else {
      setPromptStatus({ status: promptResult.status, message: promptResult.message })
    }

    const embeddingResult = await checkEmbeddingAvailability()

    // Auto-load the embedding model from cache so it's ready immediately after page reload
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
  }, [selectedModel])

  const handleDownloadPromptModel = useCallback(async () => {
    setPromptStatus({ status: 'downloading', message: 'Downloading model...' })
    const result = await loadEngine(selectedModel, (progress, text) => {
      const pct = Math.round(progress * 100)
      setPromptStatus({ status: 'downloading', message: text || `Downloading... ${pct}%` })
    })
    if (result.success) {
      setPromptStatus({ status: 'ready', message: 'Available' })
    } else {
      setPromptStatus({ status: 'error', message: result.error })
    }
  }, [selectedModel])

  const handleLoadPromptModel = useCallback(async () => {
    setPromptStatus({ status: 'loading', message: 'Loading model...' })
    const result = await loadEngine(selectedModel)
    if (result.success) {
      setPromptStatus({ status: 'ready', message: 'Available' })
    } else {
      setPromptStatus({ status: 'error', message: result.error })
    }
  }, [selectedModel])

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

  const promptLLM = useCallback(async (systemPrompt, userMessage) => {
    return prompt(systemPrompt, userMessage)
  }, [])

  useEffect(() => {
    if (aiEnabled) {
      detectCapabilities()
    } else {
      setPromptStatus(initialStatus)
      setEmbeddingStatus(initialStatus)
      unloadEngine()
      clearModelCache()
    }
  }, [aiEnabled, detectCapabilities])

  return (
    <AIContext.Provider value={{
      promptStatus,
      embeddingStatus,
      isAIReady,
      detectCapabilities,
      downloadPromptModel: handleDownloadPromptModel,
      loadPromptModel: handleLoadPromptModel,
      loadEmbeddingModel: handleLoadEmbeddingModel,
      promptLLM,
    }}>
      {children}
    </AIContext.Provider>
  )
}
