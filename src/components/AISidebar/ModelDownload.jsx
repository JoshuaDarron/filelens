import { useState, useEffect, useCallback } from 'react'
import { useAI } from '../../hooks/useAI'
import { AVAILABLE_MODELS, isModelCached, checkLLMAvailability } from '../../services/ai/llmService'

export function ModelDownload() {
  const { loadLLM, llmStatus } = useAI()
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [confirmed, setConfirmed] = useState(false)
  const [cachedModels, setCachedModels] = useState({})
  const [backend, setBackend] = useState(null)

  useEffect(() => {
    // Check which models are already cached
    const checkCached = async () => {
      const cached = {}
      for (const model of AVAILABLE_MODELS) {
        cached[model.id] = await isModelCached(model.id)
      }
      setCachedModels(cached)
    }
    checkCached()

    // Detect hardware backend
    checkLLMAvailability().then(result => setBackend(result))
  }, [])

  const isLoading = llmStatus.status === 'loading'
  const selectedInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel)
  const isCached = cachedModels[selectedModel]

  const handleDownload = useCallback(() => {
    if (!confirmed && !isCached) return
    loadLLM(selectedModel)
  }, [selectedModel, confirmed, isCached, loadLLM])

  if (isLoading) {
    return (
      <div className="ai-model-download">
        <div className="ai-model-download-progress">
          <div className="ai-loading-spinner" />
          <p>{llmStatus.message}</p>
          {llmStatus.progress > 0 && (
            <div className="ai-progress-bar" style={{ width: '100%', maxWidth: 200 }}>
              <div className="ai-progress-fill" style={{ width: `${llmStatus.progress * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ai-model-download">
      <div className="ai-model-download-header">
        <i className="bi bi-cpu"></i>
        <p>Download a language model to enable file summarization and Q&A. Models run entirely in your browser.</p>
      </div>

      {backend && (
        <div className="ai-model-backend">
          <i className="bi bi-gpu-card"></i>
          {backend.message}
        </div>
      )}

      <div className="ai-model-select">
        {AVAILABLE_MODELS.map((model) => (
          <div
            key={model.id}
            className={`ai-model-option ${selectedModel === model.id ? 'selected' : ''}`}
            onClick={() => setSelectedModel(model.id)}
          >
            <div className="ai-model-option-radio" />
            <div className="ai-model-option-info">
              <div className="ai-model-option-name">{model.name}</div>
              <div className="ai-model-option-desc">{model.description}</div>
            </div>
            <div>
              <div className="ai-model-option-size">{model.size}</div>
              {cachedModels[model.id] && (
                <div className="ai-model-option-cached">Cached</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isCached && (
        <label className="ai-model-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I understand this will download {selectedInfo?.size} of model data
        </label>
      )}

      <button
        className="btn btn-primary"
        onClick={handleDownload}
        disabled={!confirmed && !isCached}
      >
        {isCached ? 'Load Model' : 'Download & Load'}
      </button>

      {llmStatus.status === 'error' && (
        <div className="ai-error-state">
          <p>{llmStatus.message}</p>
        </div>
      )}
    </div>
  )
}
