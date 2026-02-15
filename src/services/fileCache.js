// File content cache with SHA-256 hash validation
// Uses chrome.storage.local with LRU eviction (max 20 entries, max 5MB per entry)

const CACHE_KEY = 'filelens-file-cache'
const MAX_ENTRIES = 20
const MAX_ENTRY_SIZE = 5 * 1024 * 1024 // 5MB

async function hashContent(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function getStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return chrome.storage.local
  }
  return null
}

async function readCache() {
  const storage = getStorage()
  if (!storage) return {}
  return new Promise((resolve) => {
    storage.get(CACHE_KEY, (result) => {
      resolve(result[CACHE_KEY] || {})
    })
  })
}

async function writeCache(cache) {
  const storage = getStorage()
  if (!storage) return
  return new Promise((resolve) => {
    storage.set({ [CACHE_KEY]: cache }, resolve)
  })
}

export async function getCachedFile(filename, rawText) {
  const storage = getStorage()
  if (!storage) return null

  const hash = await hashContent(rawText)
  const cache = await readCache()
  const entry = cache[filename]

  if (entry && entry.hash === hash) {
    // Update access time for LRU
    entry.accessedAt = Date.now()
    await writeCache(cache)
    return entry.parsedData
  }

  return null
}

export async function setCachedFile(filename, rawText, parsedData) {
  const storage = getStorage()
  if (!storage) return

  // Check size limit
  const serialized = JSON.stringify(parsedData)
  if (serialized.length > MAX_ENTRY_SIZE) return

  const hash = await hashContent(rawText)
  const cache = await readCache()

  // LRU eviction if at capacity
  const keys = Object.keys(cache)
  if (keys.length >= MAX_ENTRIES && !cache[filename]) {
    const oldest = keys.reduce((a, b) =>
      (cache[a].accessedAt || 0) < (cache[b].accessedAt || 0) ? a : b
    )
    delete cache[oldest]
  }

  cache[filename] = {
    hash,
    parsedData,
    accessedAt: Date.now(),
    createdAt: Date.now(),
  }

  await writeCache(cache)
}

export async function clearFileCache() {
  const storage = getStorage()
  if (!storage) return
  return new Promise((resolve) => {
    storage.remove(CACHE_KEY, resolve)
  })
}
