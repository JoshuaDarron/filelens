import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock chrome.storage.local
let storageData = {}

const mockStorage = {
  get: vi.fn((key, cb) => cb({ ...storageData })),
  set: vi.fn((data, cb) => {
    Object.assign(storageData, data)
    cb?.()
  }),
  remove: vi.fn((key, cb) => {
    delete storageData[key]
    cb?.()
  }),
}

// Mock crypto.subtle.digest — deterministic hash based on content bytes
const mockDigest = vi.fn(async (algo, data) => {
  const arr = new Uint8Array(data)
  const hash = new Uint8Array(32)
  for (let i = 0; i < arr.length && i < 32; i++) {
    hash[i] = arr[i]
  }
  return hash.buffer
})

beforeEach(() => {
  storageData = {}
  vi.clearAllMocks()
  vi.stubGlobal('chrome', { storage: { local: mockStorage } })
  vi.spyOn(crypto.subtle, 'digest').mockImplementation(mockDigest)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// Dynamic import so the module picks up our mocked globals
async function loadModule() {
  // Clear module cache to get fresh imports each test
  const mod = await import('./fileCache.js')
  return mod
}

describe('fileCache', () => {
  it('returns null on cache miss', async () => {
    const { getCachedFile } = await loadModule()
    const result = await getCachedFile('test.csv', 'hello')
    expect(result).toBeNull()
  })

  it('returns cached data on cache hit with matching hash', async () => {
    const { getCachedFile, setCachedFile } = await loadModule()
    const parsedData = { rows: [[1, 2, 3]] }
    await setCachedFile('test.csv', 'hello', parsedData)

    const result = await getCachedFile('test.csv', 'hello')
    expect(result).toEqual(parsedData)
  })

  it('returns null when hash does not match (content changed)', async () => {
    const { getCachedFile, setCachedFile } = await loadModule()
    await setCachedFile('test.csv', 'hello', { rows: [] })
    const result = await getCachedFile('test.csv', 'different content')
    expect(result).toBeNull()
  })

  it('updates accessedAt on cache hit (LRU)', async () => {
    const { getCachedFile, setCachedFile } = await loadModule()
    await setCachedFile('test.csv', 'hello', { data: true })

    await getCachedFile('test.csv', 'hello')

    const setCalls = mockStorage.set.mock.calls
    const lastSetCall = setCalls[setCalls.length - 1][0]
    const cache = lastSetCall['filelens-file-cache']
    expect(cache['test.csv'].accessedAt).toBeDefined()
  })

  it('skips entries exceeding 5MB', async () => {
    const { getCachedFile, setCachedFile } = await loadModule()
    const largeData = 'x'.repeat(6 * 1024 * 1024)
    await setCachedFile('big.csv', 'hello', largeData)

    const result = await getCachedFile('big.csv', 'hello')
    expect(result).toBeNull()
  })

  it('evicts oldest entry at 20-entry cap', async () => {
    const { setCachedFile } = await loadModule()
    // Pre-fill cache with 20 entries
    const cache = {}
    for (let j = 0; j < 20; j++) {
      cache[`file-${j}.csv`] = {
        hash: `hash-${j}`,
        parsedData: { id: j },
        accessedAt: j * 1000,
        createdAt: j * 1000,
      }
    }
    storageData['filelens-file-cache'] = cache

    // Add entry 21 — should evict file-0.csv (oldest accessedAt = 0)
    await setCachedFile('new-file.csv', 'new content', { id: 'new' })

    const finalCache = storageData['filelens-file-cache']
    expect(finalCache['file-0.csv']).toBeUndefined()
    expect(finalCache['new-file.csv']).toBeDefined()
  })

  it('clearFileCache removes the cache key', async () => {
    const { clearFileCache } = await loadModule()
    storageData['filelens-file-cache'] = { 'test.csv': {} }
    await clearFileCache()
    expect(mockStorage.remove).toHaveBeenCalledWith('filelens-file-cache', expect.any(Function))
  })

  it('returns null when chrome.storage is not available', async () => {
    vi.stubGlobal('chrome', undefined)
    const { getCachedFile } = await loadModule()
    const result = await getCachedFile('test.csv', 'hello')
    expect(result).toBeNull()
  })
})
