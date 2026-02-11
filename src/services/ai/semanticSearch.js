import { embedText, embedBatch, cosineSimilarity } from './embeddingService'

export function chunkForSearch(fileData, fileType) {
  if (!fileData) return []

  switch (fileType) {
    case 'csv':
      return chunkCsv(fileData)
    case 'json':
      return chunkJson(fileData)
    case 'txt':
    case 'md':
      return chunkText(fileData)
    default:
      return []
  }
}

function chunkCsv(data) {
  if (!Array.isArray(data) || data.length < 2) return []

  const headers = data[0]
  const chunks = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const text = headers.map((h, j) => `${h}: ${row[j] || ''}`).join(', ')
    chunks.push({
      text,
      location: `Row ${i}`,
      rowIndex: i,
    })
  }

  return chunks
}

function chunkJson(data, prefix = '', depth = 0) {
  if (depth > 3) return []
  const chunks = []

  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      const path = `${prefix}[${i}]`
      if (typeof item === 'object' && item !== null) {
        chunks.push(...chunkJson(item, path, depth + 1))
      } else {
        chunks.push({
          text: `${path}: ${JSON.stringify(item)}`,
          location: path,
        })
      }
    })
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data)
    // Create a chunk for the object summary
    const summary = entries.map(([k, v]) => {
      if (typeof v === 'object') return `${k}: ${Array.isArray(v) ? `[${v.length} items]` : '{...}'}`
      return `${k}: ${JSON.stringify(v)}`
    }).join(', ')

    chunks.push({
      text: summary,
      location: prefix || 'root',
    })

    // Recurse into nested objects
    for (const [key, value] of entries) {
      if (typeof value === 'object' && value !== null) {
        const path = prefix ? `${prefix}.${key}` : key
        chunks.push(...chunkJson(value, path, depth + 1))
      }
    }
  }

  return chunks
}

function chunkText(text) {
  if (!text) return []

  // Split by paragraphs (double newline) or fall back to lines
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())

  if (paragraphs.length <= 1) {
    // Split by single lines if no paragraph breaks
    const lines = text.split('\n').filter(l => l.trim())
    const chunks = []
    for (let i = 0; i < lines.length; i++) {
      chunks.push({
        text: lines[i].trim(),
        location: `Line ${i + 1}`,
        lineIndex: i,
      })
    }
    return chunks
  }

  let lineOffset = 0
  return paragraphs.map((p) => {
    const startLine = lineOffset + 1
    lineOffset += p.split('\n').length + 1
    return {
      text: p.trim(),
      location: `Line ${startLine}`,
      lineIndex: startLine - 1,
    }
  })
}

export async function buildSearchIndex(chunks, onProgress) {
  if (!chunks || chunks.length === 0) {
    return { index: null, error: 'No content to index' }
  }

  const texts = chunks.map(c => c.text)
  const { embeddings, error } = await embedBatch(texts, onProgress)

  if (error) {
    return { index: null, error }
  }

  return {
    index: chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    })),
    error: null,
  }
}

export async function searchIndex(index, query, topK = 10) {
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
  return { results: scored.slice(0, topK), error: null }
}
