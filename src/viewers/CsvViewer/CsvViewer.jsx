import { useContext, useEffect, useCallback } from 'react'
import { FileContext } from '../../context/FileContext'
import { useToast } from '../../hooks/useToast'
import { usePagination } from '../../hooks/usePagination'
import { useFileLoader } from '../../hooks/useFileLoader'
import { useOptionsHeader } from '../../hooks/useOptionsHeader'
import { useOptionsHeaderPortal } from '../../hooks/useOptionsHeaderPortal'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Pagination } from '../../components/Pagination/Pagination'
import { CsvTable } from './CsvTable'
import { parseCSV, generateCSVContent, createDefaultCSV, validateCSVData } from '../../utils/csvParser'
import { saveFile, downloadFile } from '../../utils/fileHelpers'

export function CsvViewer() {
  const {
    fileData,
    filename,
    fileHandle,
    isModified,
    isLoading,
    setIsLoading,
    loadFile,
    updateData,
    markSaved,
    resetFile
  } = useContext(FileContext)

  const toast = useToast()
  const { loadFromFile, openFilePicker, isValidFile } = useFileLoader()

  // Prevent page-level scroll when data is loaded (grid handles its own scroll)
  useEffect(() => {
    if (!fileData) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [!!fileData]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalDataRows = fileData ? fileData.length - 1 : 0
  const pagination = usePagination(totalDataRows)

  const processCSVText = useCallback((text, fname, handle = null, url = null) => {
    try {
      if (!text || text.trim().length === 0) {
        const defaultData = createDefaultCSV()
        loadFile(defaultData, fname, 'csv', handle, url)
        toast.info('Empty CSV file loaded. A default structure has been created.', 'Empty File')
        return
      }

      const data = parseCSV(text)
      const validation = validateCSVData(data)

      if (!validation.valid) {
        const defaultData = createDefaultCSV()
        loadFile(defaultData, fname, 'csv', handle, url)
        toast.info('Empty CSV file loaded. A default structure has been created.', 'Empty File')
        return
      }

      if (validation.type === 'headerOnly') {
        const newData = [validation.headers, new Array(validation.headers.length).fill('')]
        loadFile(newData, fname, 'csv', handle, url)
        toast.info('CSV contains only headers. An empty row has been added for editing.', 'Headers Only')
        return
      }

      if (validation.type === 'emptyData') {
        const newData = [validation.headers, new Array(validation.headers.length).fill('')]
        loadFile(newData, fname, 'csv', handle, url)
        toast.info('CSV contains no data rows. An empty row has been added for editing.', 'No Data')
        return
      }

      loadFile(data, fname, 'csv', handle, url)
      toast.success('CSV loaded successfully!')
    } catch (error) {
      toast.error(`Error processing CSV: ${error.message}`)
    }
  }, [loadFile, toast])

  const handleOpenFile = useCallback(async (fileOrEvent) => {
    // If called with a file directly (from input or drop)
    if (fileOrEvent instanceof File) {
      try {
        const { text, filename: fname } = await loadFromFile(fileOrEvent, null)
        processCSVText(text, fname, null, null)
        pagination.resetPagination()
      } catch {
        // Error already handled in loadFromFile
      }
      return
    }

    // If called without arguments (from button click)
    if (window.showOpenFilePicker) {
      try {
        const result = await openFilePicker({
          'text/csv': ['.csv'],
          'text/plain': ['.txt']
        })
        if (result) {
          const { text, filename: fname } = await loadFromFile(result.file, result.handle)
          processCSVText(text, fname, result.handle, null)
          pagination.resetPagination()
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Error already handled
        }
      }
    }
  }, [loadFromFile, openFilePicker, processCSVText, pagination])

  const handleFileDrop = useCallback(async (file, handle) => {
    if (!isValidFile(file, ['.csv', '.txt'])) {
      toast.error('Please drop a valid CSV file (.csv, .txt)')
      return
    }
    try {
      const { text, filename: fname } = await loadFromFile(file, handle)
      processCSVText(text, fname, handle, null)
      pagination.resetPagination()
    } catch {
      // Error already handled
    }
  }, [isValidFile, loadFromFile, processCSVText, pagination, toast])

  const handleCellEdit = useCallback((rowIndex, colIndex, value) => {
    if (!fileData) return

    const newData = fileData.map((row, i) => {
      if (i === rowIndex) {
        const newRow = [...row]
        newRow[colIndex] = value
        return newRow
      }
      return row
    })

    updateData(newData)
  }, [fileData, updateData])

  const handlePaste = useCallback((pastedData, startRow, startCol) => {
    if (!fileData) return

    const lines = pastedData.trim().split('\n')
    const newData = [...fileData]

    lines.forEach((line, rowOffset) => {
      const cells = line.split('\t').length > 1 ? line.split('\t') : line.split(',')
      cells.forEach((cellValue, colOffset) => {
        const targetRow = startRow + rowOffset
        const targetCol = startCol + colOffset

        if (targetCol < fileData[0].length) {
          if (!newData[targetRow]) {
            newData[targetRow] = new Array(fileData[0].length).fill('')
          }
          newData[targetRow][targetCol] = cellValue.trim()
        }
      })
    })

    updateData(newData)
  }, [fileData, updateData])

  const handleSave = useCallback(async () => {
    if (!fileHandle || !fileData) return

    try {
      const content = generateCSVContent(fileData)
      await saveFile(fileHandle, content)
      markSaved()
      toast.success('File saved successfully!')
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(`Error saving file: ${err.message}`)
      }
    }
  }, [fileHandle, fileData, markSaved, toast])

  const handleExport = useCallback(() => {
    if (!fileData) return

    try {
      const content = generateCSVContent(fileData)
      const success = downloadFile(content, filename || 'edited_data.csv', 'text/csv')
      if (success) {
        toast.success('CSV exported successfully!')
      }
    } catch (error) {
      toast.error(`Error exporting CSV: ${error.message}`)
    }
  }, [fileData, filename, toast])

  // Load from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const csvUrl = urlParams.get('url')
    const type = urlParams.get('type')

    if (csvUrl && (!type || type === 'csv')) {
      setIsLoading(true)
      const loadFromURL = async () => {
        const loadingId = toast.loading('Loading CSV...')
        try {
          let text
          let fname

          if (csvUrl.startsWith('file://')) {
            const xhr = new XMLHttpRequest()
            text = await new Promise((resolve, reject) => {
              xhr.open('GET', csvUrl, true)
              xhr.responseType = 'text'
              xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 0) {
                  resolve(xhr.responseText)
                } else {
                  reject(new Error(`Failed to load file: ${xhr.statusText}`))
                }
              }
              xhr.onerror = () => reject(new Error('Failed to load local file'))
              xhr.send()
            })
            let path = decodeURIComponent(csvUrl.replace('file:///', '').replace('file://', ''))
            path = path.replace(/\//g, '\\')
            fname = path.split('\\').pop() || path.split('/').pop() || 'local.csv'
          } else {
            const response = await fetch(csvUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch CSV: ${response.statusText}`)
            }
            text = await response.text()
            const pathname = new URL(csvUrl).pathname
            fname = pathname.split('/').pop() || 'remote.csv'
          }

          toast.hide(loadingId)
          setIsLoading(false)
          processCSVText(text, fname, null, csvUrl)
        } catch (error) {
          toast.hide(loadingId)
          setIsLoading(false)
          if (csvUrl.startsWith('file://')) {
            toast.error(
              'Unable to load local file. Please ensure "Allow access to file URLs" is enabled in the extension settings.',
              'File Access Error',
              { duration: 10000 }
            )
          } else {
            toast.error(`Error loading CSV: ${error.message}`)
          }
        }
      }
      loadFromURL()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useOptionsHeader({})

  const { renderControls } = useOptionsHeaderPortal()

  if (!fileData) {
    return (
      <main className="main-content">
        {isLoading ? (
          <div className="viewer-loading">
            <div className="viewer-loading-spinner"></div>
            <div className="viewer-loading-text">Loading...</div>
          </div>
        ) : (
          <EmptyState
            icon="bi-file-earmark-spreadsheet"
            title="CSV Editor & Viewer"
            description="Open a CSV file to view and edit its contents. You can also click on any CSV link on the web and it will automatically open in this editor."
            onFileDrop={handleFileDrop}
            onOpenFile={handleOpenFile}
            acceptedExtensions={['.csv', '.txt']}
            dropZoneText="Drop your CSV file here"
            dropZoneButtonText="Choose CSV File"
          />
        )}
      </main>
    )
  }

  return (
    <>
      {renderControls(
        <>
          <div className="stats">
            <div className="stat">
              <i className="bi bi-bar-chart-steps"></i>
              <span>{totalDataRows} rows</span>
            </div>
            <div className="stat">
              <i className="bi bi-columns-gap"></i>
              <span>{fileData[0]?.length || 0} columns</span>
            </div>
          </div>
          {isModified && (
            <div className="stat">
              <i className="bi bi-pencil-square"></i>
              <span>Modified</span>
            </div>
          )}
          {fileHandle && (
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="bi bi-floppy"></i> Save
            </button>
          )}
          <button className="btn btn-success" onClick={handleExport}>
            <i className="bi bi-download"></i>
          </button>
        </>
      )}
      <div className="viewer-layout">
        <main className="main-content">
          <div className="table-container" style={{ display: 'flex' }}>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              rowsPerPage={pagination.rowsPerPage}
              totalItems={totalDataRows}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onRowsPerPageChange={pagination.changeRowsPerPage}
              pageNumbers={pagination.getPageNumbers()}
              isFirstPage={pagination.isFirstPage}
              isLastPage={pagination.isLastPage}
            />
            <CsvTable
              data={fileData}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onCellEdit={handleCellEdit}
              onPaste={handlePaste}
            />
          </div>
        </main>
      </div>
    </>
  )
}
