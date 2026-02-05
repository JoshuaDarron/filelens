export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename) {
  return filename.toLowerCase().split('.').pop() || ''
}

export function getFileType(filename) {
  const ext = getFileExtension(filename)
  switch (ext) {
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    case 'md':
    case 'markdown':
      return 'md'
    case 'txt':
    default:
      return 'txt'
  }
}

export function getMimeType(fileType) {
  switch (fileType) {
    case 'csv':
      return 'text/csv'
    case 'json':
      return 'application/json'
    case 'md':
    case 'txt':
    default:
      return 'text/plain'
  }
}

export async function saveFile(fileHandle, content) {
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return true
  }
  return false
}
