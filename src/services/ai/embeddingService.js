let pipeline = null
let modelInstance = null
let modelStatus = 'idle' // idle | loading | ready | error

async function isModelCached() {
  try {
    // Transformers.js stores models in the Cache API
    const cacheNames = await caches.keys()
    return cacheNames.some(name => name.includes('transformers'))
  } catch {
    return false
  }
}

export async function checkEmbeddingAvailability() {
  if (modelStatus === 'ready') {
    return { available: true, status: 'ready', message: 'Available' }
  }

  const cached = await isModelCached()
  if (cached) {
    return { available: false, status: 'needs-load', message: 'Model cached — ready to load' }
  }

  return { available: false, status: 'unavailable', message: 'Not configured' }
}

export async function loadEmbeddingModel(onProgress) {
  if (modelStatus === 'ready' && modelInstance) {
    return { success: true }
  }

  modelStatus = 'loading'

  try {
    const { pipeline: pipelineFn } = await import('@xenova/transformers')
    pipeline = pipelineFn

    modelInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: (data) => {
        if (data.status === 'progress' && data.total) {
          onProgress?.(data.loaded / data.total)
        }
      }
    })

    modelStatus = 'ready'
    return { success: true }
  } catch (err) {
    modelStatus = 'error'
    return { success: false, error: err.message || 'Failed to load embedding model' }
  }
}

export async function embedText(text) {
  if (!modelInstance) {
    return { embedding: null, error: 'Embedding model not loaded' }
  }

  try {
    const output = await modelInstance(text, { pooling: 'mean', normalize: true })
    return { embedding: Array.from(output.data), error: null }
  } catch (err) {
    return { embedding: null, error: err.message || 'Embedding failed' }
  }
}

export async function embedBatch(texts) {
  if (!modelInstance) {
    return { embeddings: null, error: 'Embedding model not loaded' }
  }

  try {
    const embeddings = []
    for (const text of texts) {
      const output = await modelInstance(text, { pooling: 'mean', normalize: true })
      embeddings.push(Array.from(output.data))
    }
    return { embeddings, error: null }
  } catch (err) {
    return { embeddings: null, error: err.message || 'Batch embedding failed' }
  }
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1)
}

export function getModelStatus() {
  return modelStatus
}

export async function clearModelCache() {
  try {
    // Clear from Cache API (where Transformers.js stores models)
    const cacheNames = await caches.keys()
    for (const name of cacheNames) {
      if (name.includes('transformers')) {
        await caches.delete(name)
      }
    }
    modelInstance = null
    modelStatus = 'idle'
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
