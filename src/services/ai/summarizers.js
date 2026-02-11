import { estimateTokens } from './promptService'

const MAX_TOKENS = 3500

function truncateToTokenLimit(text, limit = MAX_TOKENS) {
  if (estimateTokens(text) <= limit) return text
  // Truncate to roughly fit the token limit
  const charLimit = limit * 4
  return text.slice(0, charLimit) + '\n...(truncated)'
}

export function buildCsvSummaryPrompt(fileData) {
  if (!fileData || fileData.length < 2) {
    return null
  }

  const headers = fileData[0]
  const dataRows = fileData.slice(1)
  const sampleSize = Math.min(20, dataRows.length)
  const sampleRows = dataRows.slice(0, sampleSize)

  let csvSample = headers.join(',') + '\n'
  for (const row of sampleRows) {
    csvSample += row.join(',') + '\n'
  }

  csvSample = truncateToTokenLimit(csvSample)

  return `Analyze this CSV data and provide a concise summary. Include:
- What the data represents
- Key columns and their meaning
- Notable patterns or statistics (min, max, averages if numeric)
- Data quality observations (empty cells, inconsistencies)

Total rows: ${dataRows.length}, Columns: ${headers.length}
${dataRows.length > sampleSize ? `(Showing first ${sampleSize} rows)` : ''}

${csvSample}`
}

export function buildJsonSummaryPrompt(fileData) {
  if (fileData === null || fileData === undefined) {
    return null
  }

  function summarizeStructure(obj, depth = 0, maxDepth = 2) {
    if (depth > maxDepth) return '...'
    if (obj === null) return 'null'
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]'
      const sample = summarizeStructure(obj[0], depth + 1, maxDepth)
      return `Array(${obj.length}) [${sample}, ...]`
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj)
      if (keys.length === 0) return '{}'
      const entries = keys.slice(0, 10).map(key => {
        const val = summarizeStructure(obj[key], depth + 1, maxDepth)
        return `"${key}": ${val}`
      })
      const suffix = keys.length > 10 ? `, ... (${keys.length - 10} more keys)` : ''
      return `{ ${entries.join(', ')}${suffix} }`
    }
    if (typeof obj === 'string') return `"${obj.length > 50 ? obj.slice(0, 50) + '...' : obj}"`
    return String(obj)
  }

  const structure = summarizeStructure(fileData)
  const text = truncateToTokenLimit(structure)

  return `Analyze this JSON structure and provide a concise summary. Include:
- What the data represents
- Key fields and their types
- Array sizes and nested structures
- Notable patterns or observations

${text}`
}

export function buildTxtSummaryPrompt(fileData, fileType) {
  if (!fileData) return null

  const text = truncateToTokenLimit(fileData, 3000)
  const isMarkdown = fileType === 'md'

  return `Analyze this ${isMarkdown ? 'Markdown' : 'text'} file and provide a concise summary. Include:
- Main topic or purpose
- Key sections or themes
- Important details or takeaways
${isMarkdown ? '- Document structure (headings, lists, code blocks)' : ''}

${text}`
}

export function buildDirectorySummaryPrompt(files) {
  if (!files || files.length === 0) return null

  const dirs = files.filter(f => f.kind === 'directory')
  const fileEntries = files.filter(f => f.kind === 'file')

  const extCounts = {}
  for (const f of fileEntries) {
    const ext = f.name.split('.').pop()?.toLowerCase() || 'unknown'
    extCounts[ext] = (extCounts[ext] || 0) + 1
  }

  let listing = `Directory contents: ${files.length} items (${dirs.length} folders, ${fileEntries.length} files)\n\n`
  listing += 'File types: ' + Object.entries(extCounts).map(([ext, count]) => `${ext}: ${count}`).join(', ') + '\n\n'
  listing += 'Items:\n'
  for (const f of files.slice(0, 50)) {
    const type = f.kind === 'directory' ? '[DIR]' : `[${f.name.split('.').pop()?.toUpperCase() || 'FILE'}]`
    const size = f.size ? ` (${(f.size / 1024).toFixed(1)} KB)` : ''
    listing += `${type} ${f.name}${size}\n`
  }

  if (files.length > 50) {
    listing += `\n...and ${files.length - 50} more items`
  }

  listing = truncateToTokenLimit(listing)

  return `Analyze this directory listing and provide a concise summary. Include:
- What kind of project or content this appears to be
- Key files or folders and their likely purpose
- File type distribution
- Any notable patterns

${listing}`
}
