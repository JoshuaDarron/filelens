// LLM service — main-thread API for WebLLM
// Offloads model inference to a Web Worker

import { CreateWebWorkerMLCEngine, hasModelInCache, deleteModelInCache, prebuiltAppConfig } from '@mlc-ai/web-llm'

let engine = null
let currentModelId = null

// Available models for the UI
export const AVAILABLE_MODELS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M',
    size: '~376 MB',
    sizeBytes: 376 * 1024 * 1024,
    description: 'Tiny model, fastest download and inference',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    size: '~879 MB',
    sizeBytes: 879 * 1024 * 1024,
    description: 'Good balance of quality and speed',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B',
    size: '~1.7 GB',
    sizeBytes: 1774 * 1024 * 1024,
    description: 'Strong small model with good comprehension',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    size: '~2.3 GB',
    sizeBytes: 2264 * 1024 * 1024,
    description: 'Highest quality, requires more VRAM',
  },
]

export async function checkLLMAvailability() {
  // Check WebGPU support
  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
  let gpuDetails = null

  if (hasWebGPU) {
    try {
      const adapter = await navigator.gpu.requestAdapter()
      if (adapter) {
        const info = adapter.info || {}
        gpuDetails = {
          vendor: info.vendor || 'unknown',
          architecture: info.architecture || 'unknown',
        }
      }
    } catch {
      // WebGPU check failed
    }
  }

  const backend = hasWebGPU && gpuDetails ? 'webgpu' : 'wasm'
  const cores = navigator.hardwareConcurrency || 4

  return {
    available: true, // web-llm supports both WebGPU and WASM fallback
    backend,
    message: backend === 'webgpu'
      ? `WebGPU available (${gpuDetails?.vendor || 'unknown'})`
      : `WASM fallback (${cores} cores)`,
    details: { gpuDetails, cores, backend },
  }
}

export async function isModelCached(modelId) {
  try {
    return await hasModelInCache(modelId)
  } catch {
    return false
  }
}

export async function loadLLM(modelId, onProgress) {
  if (engine && currentModelId === modelId) {
    return { success: true }
  }

  // Unload previous engine if switching models
  if (engine) {
    try { await engine.unload() } catch { /* ignore */ }
    engine = null
    currentModelId = null
  }

  try {
    const worker = new Worker(
      new URL('./llm.worker.js', import.meta.url),
      { type: 'module' }
    )

    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (progress) => {
        if (onProgress) {
          onProgress({
            text: progress.text || '',
            progress: progress.progress || 0,
          })
        }
      },
    })

    currentModelId = modelId
    return { success: true }
  } catch (error) {
    engine = null
    currentModelId = null
    return { success: false, error: error.message || 'Failed to load LLM' }
  }
}

export async function generateText(messages, onToken) {
  if (!engine) {
    throw new Error('LLM not loaded. Call loadLLM() first.')
  }

  const reply = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1024,
  })

  let fullText = ''
  for await (const chunk of reply) {
    const delta = chunk.choices[0]?.delta?.content || ''
    if (delta) {
      fullText += delta
      if (onToken) onToken(delta, fullText)
    }
  }

  return fullText
}

export function getLLMStatus() {
  if (!engine) return { loaded: false, modelId: null }
  return { loaded: true, modelId: currentModelId }
}

export async function clearLLMCache(modelId) {
  try {
    if (engine && currentModelId === modelId) {
      await engine.unload()
      engine = null
      currentModelId = null
    }
    await deleteModelInCache(modelId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function clearAllLLMCache() {
  if (engine) {
    try { await engine.unload() } catch { /* ignore */ }
    engine = null
    currentModelId = null
  }

  const results = []
  for (const model of AVAILABLE_MODELS) {
    try {
      const cached = await hasModelInCache(model.id)
      if (cached) {
        await deleteModelInCache(model.id)
        results.push(model.id)
      }
    } catch { /* ignore */ }
  }
  return results
}
