import { useContext, useEffect, useCallback, useState } from 'react'
import { FileContext } from '../../context/FileContext'
import { useToast } from '../../hooks/useToast'
import { usePagination } from '../../hooks/usePagination'
import { useFileLoader } from '../../hooks/useFileLoader'
import { Header } from '../../components/Header/Header'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { Pagination } from '../../components/Pagination/Pagination'
import { CsvTable } from './CsvTable'
import { parseCSV, generateCSVContent, createDefaultCSV, validateCSVData } from '../../utils/csvParser'
import { saveFile, downloadFile } from '../../utils/fileHelpers'
import { AISidebar } from '../../components/AISidebar/AISidebar'
import { SummaryView } from '../../components/AISidebar/SummaryView'
import { SemanticSearchView } from '../../components/AISidebar/SemanticSearchView'
import { useAISidebar } from '../../hooks/useAISidebar'
import { useAI } from '../../hooks/useAI'
import { useAISettings } from '../../hooks/useAISettings'
import { useSearchIndex } from '../../hooks/useSearchIndex'
import { SuggestionView } from '../../components/AISidebar/SuggestionView'
import { buildCsvSummaryPrompt } from '../../services/ai/summarizers'
import { buildCsvEditSuggestionPrompt, parseSuggestions } from '../../services/ai/editSuggestions'
import { createPromptSession, prompt as aiPrompt, destroySession } from '../../services/ai/promptService'

export function CsvViewer() {
  const {
    fileData,
    filename,
    fileHandle,
    isModified,
    loadFile,
    updateData,
    markSaved,
    resetFile
  } = useContext(FileContext)

  const toast = useToast()
  const { loadFromFile, openFilePicker, isValidFile } = useFileLoader()
  const { aiEnabled } = useAISettings()
  const { isAIReady } = useAI()
  const sidebar = useAISidebar()
  const searchIndex = useSearchIndex(fileData, 'csv')
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState(null)

  const generateSuggestions = useCallback(async () => {
    if (suggestions || suggestionsLoading) return

    const promptText = buildCsvEditSuggestionPrompt(fileData)
    if (!promptText) return

    setSuggestionsLoading(true)
    setSuggestionsError(null)

    const { session, error: sessionError } = await createPromptSession({
      systemPrompt: 'You are a data quality analyst. Suggest specific, actionable edits. Follow the exact output format requested.',
    })

    if (sessionError) {
      setSuggestionsLoading(false)
      setSuggestionsError(sessionError)
      return
    }

    const { result, error: promptError } = await aiPrompt(promptText, session)
    destroySession(session)

    setSuggestionsLoading(false)
    if (promptError) {
      setSuggestionsError(promptError)
    } else {
      setSuggestions(parseSuggestions(result))
    }
  }, [suggestions, suggestionsLoading, fileData])

  const handleDismissSuggestion = useCallback((index) => {
    setSuggestions(prev => prev?.filter((_, i) => i !== index) || null)
  }, [])

  // Auto-generate suggestions when tab is first visited
  useEffect(() => {
    if (sidebar.activeTab === 'suggestions' && sidebar.isSidebarOpen && !suggestions && !suggestionsLoading) {
      generateSuggestions()
    }
  }, [sidebar.activeTab, sidebar.isSidebarOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = useCallback(async () => {
    sidebar.toggleSidebar()
    if (summary || summaryLoading) return

    const promptText = buildCsvSummaryPrompt(fileData)
    if (!promptText) return

    setSummaryLoading(true)
    setSummaryError(null)

    const { session, error: sessionError } = await createPromptSession({
      systemPrompt: 'You are a data analyst. Provide concise, structured analysis of data files. Use plain text, not markdown.',
    })

    if (sessionError) {
      setSummaryLoading(false)
      setSummaryError(sessionError)
      return
    }

    const { result, error: promptError } = await aiPrompt(promptText, session)
    destroySession(session)

    setSummaryLoading(false)
    if (promptError) {
      setSummaryError(promptError)
    } else {
      setSummary(result)
    }
  }, [sidebar, summary, summaryLoading, fileData])

  const handleRetrySummary = useCallback(() => {
    setSummary(null)
    setSummaryError(null)
    handleAnalyze()
  }, [handleAnalyze])

  const totalDataRows = fileData ? fileData.length - 1 : 0
  const pagination = usePagination(totalDataRows)

  const handleSearchResultClick = useCallback((result) => {
    if (result.rowIndex == null) return

    const dataRowIndex = result.rowIndex - 1 // 0-based data row
    const targetPage = Math.floor(dataRowIndex / pagination.rowsPerPage) + 1

    const scrollAndHighlight = () => {
      const rowInPage = dataRowIndex - (targetPage - 1) * pagination.rowsPerPage
      const row = document.querySelector(`#csvTable tbody tr:nth-child(${rowInPage + 1})`)
      if (!row) return
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      row.classList.remove('ai-search-highlight')
      // Force reflow so re-adding the class restarts the animation
      void row.offsetWidth
      row.classList.add('ai-search-highlight')
      setTimeout(() => row.classList.remove('ai-search-highlight'), 2000)
    }

    if (targetPage !== pagination.currentPage) {
      pagination.goToPage(targetPage)
      setTimeout(scrollAndHighlight, 50)
    } else {
      scrollAndHighlight()
    }
  }, [pagination])

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
          processCSVText(text, fname, null, csvUrl)
        } catch (error) {
          toast.hide(loadingId)
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

  const stats = fileData ? {
    rows: totalDataRows,
    cols: fileData[0]?.length || 0
  } : null

  if (!fileData) {
    return (
      <>
        <Header />
        <main className="main-content">
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
        </main>
      </>
    )
  }

  const showAnalyze = aiEnabled && isAIReady

  return (
    <>
      <Header
        onSave={handleSave}
        onExport={handleExport}
        onAnalyze={handleAnalyze}
        showSave={!!fileHandle}
        showExport={true}
        showAnalyze={showAnalyze}
        stats={stats}
      />
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
        <AISidebar
          isOpen={sidebar.isSidebarOpen}
          onClose={sidebar.closeSidebar}
          activeTab={sidebar.activeTab}
          onTabChange={sidebar.setActiveTab}
        >
          {sidebar.activeTab === 'summary' && (
            <SummaryView
              summary={summary}
              isLoading={summaryLoading}
              error={summaryError}
              onRetry={handleRetrySummary}
            />
          )}
          {sidebar.activeTab === 'search' && (
            <SemanticSearchView index={searchIndex.index} indexing={searchIndex.indexing} indexProgress={searchIndex.indexProgress} indexError={searchIndex.error} onResultClick={handleSearchResultClick} />
          )}
          {sidebar.activeTab === 'suggestions' && (
            <SuggestionView
              suggestions={suggestions}
              isLoading={suggestionsLoading}
              error={suggestionsError}
              onRetry={generateSuggestions}
              onDismiss={handleDismissSuggestion}
            />
          )}
        </AISidebar>
      </div>
    </>
  )
}
