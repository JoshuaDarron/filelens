import { createContext, useState, useCallback, useEffect, useMemo } from 'react'
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

  const promptUsable = promptStatus.status === 'ready' || promptStatus.status === 'needs-load'
  const isAIReady = aiEnabled && (promptUsable || embeddingStatus.status === 'ready')

  const detectCapabilities = useCallback(async () => {
    setPromptStatus({ status: 'checking', message: 'Checking availability...' })
    setEmbeddingStatus({ status: 'checking', message: 'Checking availability...' })

    // Run both checks in parallel — neither depends on the other
    const [promptResult, embeddingResult] = await Promise.all([
      checkWebGPUAvailability(selectedModel),
      checkEmbeddingAvailability(),
    ])

    // LLM: don't auto-load (engine init is heavy); let the user trigger it or load on first prompt
    setPromptStatus({ status: promptResult.status, message: promptResult.message })

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
    // Lazy-load the engine on first prompt if it's cached but not loaded yet
    if (promptStatus.status === 'needs-load' || promptStatus.status === 'needs-download') {
      setPromptStatus({ status: 'loading', message: 'Loading model...' })
      const loadResult = await loadEngine(selectedModel, (progress, text) => {
        setPromptStatus({ status: 'loading', message: text || `Loading... ${Math.round(progress * 100)}%` })
      })
      if (!loadResult.success) {
        setPromptStatus({ status: 'error', message: loadResult.error })
        return { result: null, error: loadResult.error }
      }
      setPromptStatus({ status: 'ready', message: 'Available' })
    }
    return prompt(systemPrompt, userMessage)
  }, [promptStatus.status, selectedModel])

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

  const contextValue = useMemo(() => ({
    promptStatus,
    embeddingStatus,
    isAIReady,
    detectCapabilities,
    downloadPromptModel: handleDownloadPromptModel,
    loadPromptModel: handleLoadPromptModel,
    loadEmbeddingModel: handleLoadEmbeddingModel,
    promptLLM,
  }), [promptStatus, embeddingStatus, isAIReady, detectCapabilities, handleDownloadPromptModel, handleLoadPromptModel, handleLoadEmbeddingModel, promptLLM])

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  )
}
