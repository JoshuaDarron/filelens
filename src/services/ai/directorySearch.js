import { embedBatch, embedText, cosineSimilarity } from './embeddingService'

const SUPPORTED_EXTENSIONS = ['csv', 'json', 'txt', 'md']

function getExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function isSupported(filename) {
  return SUPPORTED_EXTENSIONS.includes(getExtension(filename))
}

async function fetchFileContent(file) {
  try {
    if (file.handle) {
      const fileObj = await file.handle.getFile()
      return await fileObj.text()
    }
    if (file.url) {
      const response = await fetch(file.url)
      return await response.text()
    }
    return null
  } catch {
    return null
  }
}

function chunkFileContent(text, filename) {
  if (!text) return []

  const ext = getExtension(filename)
  const maxChunks = 20

  if (ext === 'csv') {
    const lines = text.split('\n').filter(l => l.trim())
    const header = lines[0] || ''
    const chunks = lines.slice(1, maxChunks + 1).map(line => `${header}\n${line}`)
    return chunks
  }

  if (ext === 'json') {
    try {
      const data = JSON.parse(text)
      const str = JSON.stringify(data, null, 1)
      // Split into ~200 char chunks
      const chunks = []
      for (let i = 0; i < str.length && chunks.length < maxChunks; i += 200) {
        chunks.push(str.slice(i, i + 200))
      }
      return chunks
    } catch {
      return [text.slice(0, 500)]
    }
  }

  // txt / md — split by paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
  if (paragraphs.length > 0) {
    return paragraphs.slice(0, maxChunks).map(p => p.trim())
  }

  // Fallback: split by lines
  const lines = text.split('\n').filter(l => l.trim())
  return lines.slice(0, maxChunks)
}

export async function indexDirectory(files, onProgress) {
  const supportedFiles = files.filter(f => f.kind === 'file' && isSupported(f.name))
  const index = []
  let processed = 0

  for (const file of supportedFiles) {
    const content = await fetchFileContent(file)
    if (!content) {
      processed++
      onProgress?.(processed / supportedFiles.length)
      continue
    }

    const chunks = chunkFileContent(content, file.name)
    if (chunks.length === 0) {
      processed++
      onProgress?.(processed / supportedFiles.length)
      continue
    }

    const { embeddings, error } = await embedBatch(chunks)
    if (error || !embeddings) {
      processed++
      onProgress?.(processed / supportedFiles.length)
      continue
    }

    for (let i = 0; i < chunks.length; i++) {
      index.push({
        text: chunks[i],
        embedding: embeddings[i],
        fileName: file.name,
        fileUrl: file.url || null,
        fileHandle: file.handle || null,
        chunkIndex: i,
      })
    }

    processed++
    onProgress?.(processed / supportedFiles.length)
  }

  return { index, fileCount: supportedFiles.length }
}

export async function searchDirectory(index, query, topK = 15) {
  if (!index || index.length === 0) {
    return { results: [], error: 'No search index available' }
  }

  const { embedding: queryEmbedding, error } = await embedText(query)
  if (error) {
    return { results: [], error }
  }

  const scored = index.map(item => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }))

  scored.sort((a, b) => b.score - a.score)

  // Deduplicate by file — keep highest scoring chunk per file
  const seen = new Set()
  const deduped = []
  for (const item of scored) {
    if (!seen.has(item.fileName)) {
      seen.add(item.fileName)
      deduped.push(item)
    }
    if (deduped.length >= topK) break
  }

  return { results: deduped, error: null }
}
