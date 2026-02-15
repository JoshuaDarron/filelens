import { createContext, useState, useCallback, useMemo } from 'react'

export const FileContext = createContext(null)

export function FileProvider({ children }) {
  const [fileData, setFileData] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [filename, setFilename] = useState('')
  const [fileType, setFileType] = useState(null) // 'csv', 'json', 'txt', 'md'
  const [isModified, setIsModified] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
    setOriginalData(structuredClone(data))
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
    setOriginalData(structuredClone(fileData))
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

  const value = useMemo(() => ({
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
    isLoading,
    setIsLoading,
    resetFile,
    loadFile,
    updateData,
    markSaved,
    detectFileType
  }), [fileData, originalData, filename, fileType, isModified, fileHandle, fileUrl, isLoading, resetFile, loadFile, updateData, markSaved, detectFileType])

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  )
}
