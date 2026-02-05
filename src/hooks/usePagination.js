import { useState, useCallback, useMemo } from 'react'

export function usePagination(totalItems, initialRowsPerPage = 25) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / rowsPerPage) || 1
  }, [totalItems, rowsPerPage])

  const startIndex = useMemo(() => {
    return (currentPage - 1) * rowsPerPage
  }, [currentPage, rowsPerPage])

  const endIndex = useMemo(() => {
    return Math.min(startIndex + rowsPerPage, totalItems)
  }, [startIndex, rowsPerPage, totalItems])

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const goToFirst = useCallback(() => goToPage(1), [goToPage])
  const goToLast = useCallback(() => goToPage(totalPages), [goToPage, totalPages])
  const goToPrev = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage])
  const goToNext = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage])

  const changeRowsPerPage = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1)
  }, [])

  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const getPageNumbers = useCallback(() => {
    if (totalPages <= 1) return []

    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)

    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4)
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4)
      }
    }

    const pages = []

    if (startPage > 1) {
      pages.push({ type: 'page', value: 1 })
      if (startPage > 2) {
        pages.push({ type: 'ellipsis', value: 'start' })
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push({ type: 'page', value: i })
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push({ type: 'ellipsis', value: 'end' })
      }
      pages.push({ type: 'page', value: totalPages })
    }

    return pages
  }, [totalPages, currentPage])

  return {
    currentPage,
    rowsPerPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToFirst,
    goToLast,
    goToPrev,
    goToNext,
    changeRowsPerPage,
    resetPagination,
    getPageNumbers,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  }
}
