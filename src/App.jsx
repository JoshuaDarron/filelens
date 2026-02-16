import { useState, useEffect, useCallback, useContext, lazy, Suspense } from 'react'
import { FileContext } from './context/FileContext'
import { ToastContainer } from './components/Toast/ToastContainer'
import { Navbar } from './components/Navbar/Navbar'
import { PathBar } from './components/PathBar/PathBar'

const CsvViewer = lazy(() => import('./viewers/CsvViewer').then(m => ({ default: m.CsvViewer })))
const JsonViewer = lazy(() => import('./viewers/JsonViewer').then(m => ({ default: m.JsonViewer })))
const TxtViewer = lazy(() => import('./viewers/TxtViewer').then(m => ({ default: m.TxtViewer })))
const FileBrowser = lazy(() => import('./viewers/FileBrowser').then(m => ({ default: m.FileBrowser })))
const Settings = lazy(() => import('./components/Settings/Settings').then(m => ({ default: m.Settings })))

function ViewerLoading() {
  return (
    <div className="viewer-loading">
      <div className="viewer-loading-spinner"></div>
      <div className="viewer-loading-text">Loading...</div>
    </div>
  )
}

function App() {
  const [activeViewer, setActiveViewer] = useState(null)
  const { fileType, loadFile, detectFileType } = useContext(FileContext)

  // Determine viewer based on URL params or fileType
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const url = urlParams.get('url')
    const type = urlParams.get('type')

    if (type === 'settings') {
      setActiveViewer('settings')
    } else if (type === 'directory') {
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
      case 'settings':
        return <Settings />
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
      <Navbar />
      <PathBar />
      <Suspense fallback={<ViewerLoading />}>
        {renderViewer()}
      </Suspense>
    </>
  )
}

export default App
