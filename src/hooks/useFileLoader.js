import { useCallback, useContext } from 'react'
import { FileContext } from '../context/FileContext'
import { useToast } from './useToast'

// All text-like extensions that open in TxtViewer (mirrors background.js / content.js)
export const TEXT_FILE_EXTENSIONS = [
  '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.r', '.pl', '.lua',
  '.dart', '.zig', '.ex', '.exs', '.hs', '.ml', '.clj', '.lisp', '.vim', '.v', '.m',
  '.css', '.scss', '.sass', '.less', '.vue', '.svelte', '.astro',
  '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.properties', '.env',
  '.editorconfig', '.gitignore', '.gitattributes', '.dockerignore',
  '.sh', '.bash', '.zsh', '.fish', '.bat', '.cmd', '.ps1',
  '.log', '.sql', '.graphql', '.proto', '.tf', '.hcl', '.gradle', '.cmake',
  '.rst', '.tex', '.org'
]

export function useFileLoader() {
  const fileContext = useContext(FileContext)
  const toast = useToast()

  const fetchLocalFile = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'text'

      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.responseText)
        } else {
          reject(new Error(`Failed to load file: ${xhr.statusText}`))
        }
      }

      xhr.onerror = function() {
        reject(new Error('Failed to load local file'))
      }

      xhr.send()
    })
  }, [])

  const getFilenameFromURL = useCallback((url) => {
    try {
      if (url.startsWith('file://')) {
        let path = decodeURIComponent(url.replace('file:///', '').replace('file://', ''))
        path = path.replace(/\//g, '\\')
        return path.split('\\').pop() || path.split('/').pop() || 'local.csv'
      }

      const pathname = new URL(url).pathname
      return pathname.split('/').pop() || 'remote.csv'
    } catch {
      return 'data.csv'
    }
  }, [])

  const loadFromURL = useCallback(async (url) => {
    const loadingId = toast.loading('Loading file...')

    try {
      let text
      const filename = getFilenameFromURL(url)
      const fileType = fileContext.detectFileType(filename)

      if (url.startsWith('file://')) {
        text = await fetchLocalFile(url)
      } else {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`)
        }
        text = await response.text()
      }

      toast.hide(loadingId)
      return { text, filename, fileType, url }
    } catch (error) {
      toast.hide(loadingId)

      if (url.startsWith('file://')) {
        toast.error(
          'Unable to load local file. Please ensure "Allow access to file URLs" is enabled in the extension settings.',
          'File Access Error',
          { duration: 10000 }
        )
      } else {
        toast.error(`Error loading file: ${error.message}`)
      }
      throw error
    }
  }, [toast, fetchLocalFile, getFilenameFromURL, fileContext])

  const loadFromFile = useCallback(async (file, handle = null) => {
    const loadingId = toast.loading('Reading file...')

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Please use files under 10MB.')
      }

      const text = await file.text()
      const filename = file.name
      const fileType = fileContext.detectFileType(filename)

      toast.hide(loadingId)
      return { text, filename, fileType, handle }
    } catch (error) {
      toast.hide(loadingId)
      toast.error(`Error reading file: ${error.message}`)
      throw error
    }
  }, [toast, fileContext])

  const openFilePicker = useCallback(async (acceptTypes = {}) => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Supported Files',
            accept: {
              'text/csv': ['.csv'],
              'text/plain': ['.txt', '.md', ...TEXT_FILE_EXTENSIONS],
              'application/json': ['.json'],
              ...acceptTypes
            }
          }],
          multiple: false
        })
        const file = await handle.getFile()
        return { file, handle }
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error(`Error opening file: ${err.message}`)
        }
        throw err
      }
    }
    return null
  }, [toast])

  const isValidFile = useCallback((file, validExtensions = ['.csv', '.txt', '.json', '.md', ...TEXT_FILE_EXTENSIONS]) => {
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )
    return hasValidExtension
  }, [])

  return {
    loadFromURL,
    loadFromFile,
    openFilePicker,
    isValidFile,
    getFilenameFromURL
  }
}
