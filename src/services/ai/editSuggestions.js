import { estimateTokens } from './webllmService'

const MAX_TOKENS = 3500

function truncateToTokenLimit(text, limit = MAX_TOKENS) {
  if (estimateTokens(text) <= limit) return text
  return text.slice(0, limit * 4) + '\n...(truncated)'
}

export function buildCsvEditSuggestionPrompt(fileData) {
  if (!fileData || fileData.length < 2) return null

  const headers = fileData[0]
  const sampleSize = Math.min(15, fileData.length - 1)
  const sampleRows = fileData.slice(1, sampleSize + 1)

  let csvSample = headers.join(',') + '\n'
  for (const row of sampleRows) {
    csvSample += row.join(',') + '\n'
  }

  csvSample = truncateToTokenLimit(csvSample)

  return `Analyze this CSV data and suggest 1-3 specific, actionable edits to improve data quality. For each suggestion, provide:
1. A short title (e.g., "Standardize email formats")
2. A brief description of the issue
3. An example showing the before and after for one specific cell

Focus on: inconsistent formatting, empty required fields, obvious typos, data type mismatches, standardization opportunities.

CSV data (${fileData.length - 1} rows, ${headers.length} columns):
${csvSample}

Respond in this exact format for each suggestion:
SUGGESTION: [title]
ISSUE: [description]
BEFORE: [example cell value before]
AFTER: [example cell value after]
---`
}

export function buildJsonEditSuggestionPrompt(fileData) {
  if (fileData === null || fileData === undefined) return null

  const text = truncateToTokenLimit(JSON.stringify(fileData, null, 2))

  return `Analyze this JSON structure and suggest 1-3 specific, actionable edits to improve data quality or structure. For each suggestion, provide:
1. A short title
2. A brief description of the issue
3. The path to the value and before/after examples

Focus on: inconsistent naming conventions, missing required fields, type inconsistencies, structural improvements.

JSON data:
${text}

Respond in this exact format for each suggestion:
SUGGESTION: [title]
ISSUE: [description]
BEFORE: [example value before]
AFTER: [example value after]
---`
}

export function buildTxtEditSuggestionPrompt(fileData, fileType) {
  if (!fileData) return null

  const text = truncateToTokenLimit(fileData, 3000)
  const isMarkdown = fileType === 'md'

  return `Analyze this ${isMarkdown ? 'Markdown' : 'text'} file and suggest 1-3 specific, actionable edits to improve quality. For each suggestion, provide:
1. A short title
2. A brief description of the issue
3. A before/after example showing the exact text change

Focus on: ${isMarkdown ? 'broken links, formatting issues, heading hierarchy, missing alt text, ' : ''}grammar, clarity, inconsistencies, structure.

Text content:
${text}

Respond in this exact format for each suggestion:
SUGGESTION: [title]
ISSUE: [description]
BEFORE: [example text before]
AFTER: [example text after]
---`
}

export function parseSuggestions(rawText) {
  if (!rawText) return []

  const blocks = rawText.split('---').filter(b => b.trim())
  const suggestions = []

  for (const block of blocks) {
    const title = block.match(/SUGGESTION:\s*(.+)/i)?.[1]?.trim()
    const issue = block.match(/ISSUE:\s*(.+)/i)?.[1]?.trim()
    const before = block.match(/BEFORE:\s*(.+)/i)?.[1]?.trim()
    const after = block.match(/AFTER:\s*(.+)/i)?.[1]?.trim()

    if (title && issue) {
      suggestions.push({ title, issue, before: before || '', after: after || '' })
    }
  }

  return suggestions
}
