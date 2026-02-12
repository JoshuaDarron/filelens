let engine = null
let currentModelId = null

const MODEL_OPTIONS = [
  { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', label: 'SmolLM2 1.7B (Default)', size: '~950 MB' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B', size: '~700 MB' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 1.5B', size: '~880 MB' },
  { id: 'gemma-2-2b-it-q4f16_1-MLC', label: 'Gemma 2 2B', size: '~1.3 GB' },
]

export function getAvailableModels() {
  return MODEL_OPTIONS
}

export async function checkWebGPUAvailability(modelId) {
  try {
    if (!navigator.gpu) {
      return { status: 'unavailable', message: 'WebGPU not supported in this browser' }
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      return { status: 'unavailable', message: 'No WebGPU adapter found' }
    }

    if (engine && currentModelId === modelId) {
      return { status: 'ready', message: 'Available' }
    }

    // Check if model is cached in Cache Storage
    const isCached = await isModelCached(modelId)
    if (isCached) {
      return { status: 'needs-load', message: 'Cached — ready to load' }
    }

    return { status: 'needs-download', message: 'Model needs to be downloaded' }
  } catch (err) {
    return { status: 'error', message: err.message || 'Failed to check WebGPU availability' }
  }
}

async function isModelCached(modelId) {
  try {
    const cacheKeys = await caches.keys()
    return cacheKeys.some(key => key.includes('webllm') || key.includes(modelId) || key.includes('mlc'))
  } catch {
    return false
  }
}

export async function loadEngine(modelId, onProgress) {
  try {
    if (engine && currentModelId === modelId) {
      return { success: true }
    }

    // Unload existing engine if switching models
    if (engine) {
      await unloadEngine()
    }

    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

    engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        onProgress?.(report.progress, report.text)
      }
    })

    currentModelId = modelId
    return { success: true }
  } catch (err) {
    engine = null
    currentModelId = null
    return { success: false, error: err.message || 'Failed to load model' }
  }
}

export async function prompt(systemPrompt, userMessage) {
  if (!engine) {
    return { result: null, error: 'Model not loaded. Load a model first.' }
  }

  try {
    const reply = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    })

    const text = reply.choices[0]?.message?.content || ''
    return { result: text, error: null }
  } catch (err) {
    return { result: null, error: err.message || 'AI prompt failed' }
  }
}

export async function unloadEngine() {
  if (engine) {
    try {
      await engine.unload()
    } catch {
      // Ignore unload errors
    }
    engine = null
    currentModelId = null
  }
}

export async function clearWebLLMCache() {
  try {
    await unloadEngine()
    const cacheKeys = await caches.keys()
    for (const key of cacheKeys) {
      if (key.includes('webllm') || key.includes('mlc') || key.includes('tvmjs')) {
        await caches.delete(key)
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to clear cache' }
  }
}

export function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}
