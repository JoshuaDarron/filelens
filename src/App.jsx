import { useState, useEffect, useCallback, useContext } from 'react'
import { FileContext } from './context/FileContext'
import { ToastContainer } from './components/Toast/ToastContainer'
import { CsvViewer } from './viewers/CsvViewer'
import { JsonViewer } from './viewers/JsonViewer'
import { TxtViewer } from './viewers/TxtViewer'
import { FileBrowser } from './viewers/FileBrowser'

function App() {
  const [activeViewer, setActiveViewer] = useState(null)
  const { fileType, loadFile, detectFileType } = useContext(FileContext)

  // Determine viewer based on URL params or fileType
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const url = urlParams.get('url')
    const type = urlParams.get('type')

    if (type === 'directory') {
      setActiveViewer('browser')
    } else if (type) {
      // Explicit type parameter takes precedence
      setActiveViewer(type)
    } else if (url) {
      // Detect type from URL extension
      const detectedType = detectFileType(url)
      setActiveViewer(detectedType)
    } else {
      // No URL, default to FileBrowser
      setActiveViewer('browser')
    }
  }, [detectFileType])

  // Update active viewer when file type changes
  useEffect(() => {
    if (fileType) {
      setActiveViewer(fileType)
    }
  }, [fileType])

  // Handle file selection from FileBrowser
  const handleFileSelectFromBrowser = useCallback(async (file, handle, ext) => {
    const text = await file.text()
    const type = detectFileType(file.name)
    loadFile(type === 'csv' ? null : text, file.name, type, handle, null)
    setActiveViewer(type)

    // If it's a CSV, we need to parse it specially, so redirect to CsvViewer
    // The CsvViewer will handle the parsing when it sees no data but has a handle
    if (type === 'csv') {
      // Reset and let CSV viewer handle it via file input
      window.location.search = ''
    }
  }, [detectFileType, loadFile])

  const renderViewer = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const dirUrl = urlParams.get('type') === 'directory' ? urlParams.get('url') : null

    switch (activeViewer) {
      case 'json':
        return <JsonViewer />
      case 'txt':
      case 'md':
        return <TxtViewer />
      case 'browser':
        return <FileBrowser onFileSelect={handleFileSelectFromBrowser} dirUrl={dirUrl} />
      case 'csv':
      default:
        return <CsvViewer />
    }
  }

  return (
    <>
      <ToastContainer />
      {renderViewer()}
    </>
  )
}

export default App
