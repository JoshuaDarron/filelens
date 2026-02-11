import { createContext, useState, useCallback, useEffect } from 'react'
import { useAISettings } from '../hooks/useAISettings'
import { checkPromptAPIAvailability, downloadPromptModel } from '../services/ai/promptService'
import { checkEmbeddingAvailability, loadEmbeddingModel as loadModel } from '../services/ai/embeddingService'

export const AIContext = createContext(null)

// Status: 'idle' | 'checking' | 'ready' | 'needs-download' | 'needs-load' | 'downloading' | 'loading' | 'unavailable' | 'error'
const initialStatus = {
  status: 'idle',
  message: '',
}

export function AIProvider({ children }) {
  const { aiEnabled } = useAISettings()
  const [promptStatus, setPromptStatus] = useState(initialStatus)
  const [embeddingStatus, setEmbeddingStatus] = useState(initialStatus)

  const isAIReady = aiEnabled && (promptStatus.status === 'ready' || embeddingStatus.status === 'ready')

  const detectCapabilities = useCallback(async () => {
    setPromptStatus({ status: 'checking', message: 'Checking availability...' })
    setEmbeddingStatus({ status: 'checking', message: 'Checking availability...' })

    const promptResult = await checkPromptAPIAvailability()
    setPromptStatus({ status: promptResult.status, message: promptResult.message })

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
  }, [])

  const handleDownloadPromptModel = useCallback(async () => {
    setPromptStatus({ status: 'downloading', message: 'Downloading model...' })
    const result = await downloadPromptModel((progress) => {
      setPromptStatus({ status: 'downloading', message: `Downloading... ${Math.round(progress * 100)}%` })
    })
    if (result.success) {
      setPromptStatus({ status: 'ready', message: 'Available' })
    } else {
      setPromptStatus({ status: 'error', message: result.error })
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
      setPromptStatus(initialStatus)
      setEmbeddingStatus(initialStatus)
    }
  }, [aiEnabled, detectCapabilities])

  return (
    <AIContext.Provider value={{
      promptStatus,
      embeddingStatus,
      isAIReady,
      detectCapabilities,
      downloadPromptModel: handleDownloadPromptModel,
      loadEmbeddingModel: handleLoadEmbeddingModel,
    }}>
      {children}
    </AIContext.Provider>
  )
}
