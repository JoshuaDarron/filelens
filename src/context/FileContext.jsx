import { createContext, useState, useCallback } from 'react'

export const FileContext = createContext(null)

export function FileProvider({ children }) {
  const [fileData, setFileData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [filename, setFilename] = useState('')
  const [fileType, setFileType] = useState(null) // 'csv', 'json', 'txt', 'md'
  const [isModified, setIsModified] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)

  const resetFile = useCallback(() => {
    setFileData(null)
    setOriginalData(null)
    setFilename('')
    setFileType(null)
    setIsModified(false)
    setFileHandle(null)
    setFileUrl(null)
  }, [])

  const loadFile = useCallback((data, name, type, handle = null, url = null) => {
    setFileData(data)
    setOriginalData(JSON.parse(JSON.stringify(data)))
    setFilename(name)
    setFileType(type)
    setIsModified(false)
    setFileHandle(handle)
    setFileUrl(url)
  }, [])

  const updateData = useCallback((newData) => {
    setFileData(newData)
    setIsModified(true)
  }, [])

  const markSaved = useCallback(() => {
    setOriginalData(JSON.parse(JSON.stringify(fileData)))
    setIsModified(false)
  }, [fileData])

  const detectFileType = useCallback((filename) => {
    const ext = filename.toLowerCase().split('.').pop()
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
  }, [])

  const value = {
    fileData,
    originalData,
    filename,
    fileType,
    isModified,
    fileHandle,
    fileUrl,
    setFileData,
    setFilename,
    setFileType,
    setIsModified,
    setFileHandle,
    setFileUrl,
    resetFile,
    loadFile,
    updateData,
    markSaved,
    detectFileType
  }

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  )
}
