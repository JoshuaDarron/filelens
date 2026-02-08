import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('calculates initial state correctly', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(4)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(25)
    expect(result.current.isFirstPage).toBe(true)
    expect(result.current.isLastPage).toBe(false)
  })

  it('goToPage navigates to a valid page', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPage(3))
    expect(result.current.currentPage).toBe(3)
    expect(result.current.startIndex).toBe(50)
    expect(result.current.endIndex).toBe(75)
  })

  it('goToPage ignores out-of-bounds values', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPage(10))
    expect(result.current.currentPage).toBe(1)
    act(() => result.current.goToPage(0))
    expect(result.current.currentPage).toBe(1)
  })

  it('goToNext advances page', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToNext())
    expect(result.current.currentPage).toBe(2)
  })

  it('goToNext stops at last page', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPage(4))
    act(() => result.current.goToNext())
    expect(result.current.currentPage).toBe(4)
    expect(result.current.isLastPage).toBe(true)
  })

  it('goToPrev decrements page', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPage(3))
    act(() => result.current.goToPrev())
    expect(result.current.currentPage).toBe(2)
  })

  it('goToPrev stops at first page', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPrev())
    expect(result.current.currentPage).toBe(1)
    expect(result.current.isFirstPage).toBe(true)
  })

  it('goToFirst jumps to page 1', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPage(3))
    act(() => result.current.goToFirst())
    expect(result.current.currentPage).toBe(1)
  })

  it('goToLast jumps to last page', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToLast())
    expect(result.current.currentPage).toBe(4)
    expect(result.current.isLastPage).toBe(true)
  })

  it('changeRowsPerPage updates page size and resets to page 1', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    act(() => result.current.goToPage(3))
    act(() => result.current.changeRowsPerPage(10))
    expect(result.current.rowsPerPage).toBe(10)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(10)
  })

  it('getPageNumbers returns empty for single page', () => {
    const { result } = renderHook(() => usePagination(10, 25))
    expect(result.current.getPageNumbers()).toEqual([])
  })

  it('getPageNumbers returns pages without ellipsis for few pages', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    const pages = result.current.getPageNumbers()
    const pageValues = pages.filter(p => p.type === 'page').map(p => p.value)
    expect(pageValues).toEqual([1, 2, 3, 4])
    expect(pages.every(p => p.type === 'page')).toBe(true)
  })

  it('getPageNumbers includes ellipsis for many pages', () => {
    const { result } = renderHook(() => usePagination(500, 10))
    act(() => result.current.goToPage(25))
    const pages = result.current.getPageNumbers()
    const types = pages.map(p => p.type)
    expect(types).toContain('ellipsis')
  })

  it('isFirstPage and isLastPage flags are correct', () => {
    const { result } = renderHook(() => usePagination(100, 25))
    expect(result.current.isFirstPage).toBe(true)
    expect(result.current.isLastPage).toBe(false)

    act(() => result.current.goToLast())
    expect(result.current.isFirstPage).toBe(false)
    expect(result.current.isLastPage).toBe(true)
  })
})
