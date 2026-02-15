// Semantic search embedding/index cache using IndexedDB
// Stores pre-computed search indexes keyed by content hash

const DB_NAME = 'filelens-index-cache'
const DB_VERSION = 1
const STORE_NAME = 'indexes'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'contentHash' })
      }
    }
  })
}

export async function getCachedIndex(contentHash) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(contentHash)
      request.onsuccess = () => resolve(request.result?.index || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function setCachedIndex(contentHash, index) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put({
        contentHash,
        index,
        createdAt: Date.now(),
      })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // Silently fail — cache is optional
  }
}

export async function clearIndexCache() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // Silently fail
  }
}

export async function hashForIndex(content) {
  const text = typeof content === 'string' ? content : JSON.stringify(content)
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
