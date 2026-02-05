export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return []

  // Detect delimiter
  const firstLine = lines[0]
  let delimiter = ','
  const delimiters = [',', '\t', ';', '|']
  let maxCount = 0

  for (const del of delimiters) {
    const count = (firstLine.match(new RegExp('\\' + del, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      delimiter = del
    }
  }

  // Enhanced CSV parsing with better quote handling
  return lines.map(line => {
    const result = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
          continue
        } else if (inQuotes) {
          // End quote
          inQuotes = false
        } else {
          // Start quote
          inQuotes = true
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
      i++
    }

    result.push(current.trim())
    return result
  })
}

export function generateCSVContent(data) {
  return data.map(row => {
    return row.map(cell => {
      const cellStr = String(cell || '')
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return '"' + cellStr.replace(/"/g, '""') + '"'
      }
      return cellStr
    }).join(',')
  }).join('\n')
}

export function createDefaultCSV() {
  return [
    ['Column 1', 'Column 2', 'Column 3'],
    ['', '', '']
  ]
}

export function validateCSVData(data) {
  // Check for completely empty data
  if (!data || data.length === 0) {
    return { valid: false, type: 'empty' }
  }

  // Check if only header exists (no data rows)
  if (data.length === 1) {
    return { valid: true, type: 'headerOnly', headers: data[0] }
  }

  // Check if all rows are empty
  const hasNonEmptyData = data.some((row, index) => {
    if (index === 0) return true // Skip header check
    return row.some(cell => cell && cell.trim().length > 0)
  })

  if (!hasNonEmptyData) {
    return { valid: true, type: 'emptyData', headers: data[0] }
  }

  return { valid: true, type: 'complete' }
}
