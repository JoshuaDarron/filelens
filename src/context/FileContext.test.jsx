import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { FileContext, FileProvider } from './FileContext'

function useFile() {
  return useContext(FileContext)
}

describe('FileContext', () => {
  it('has null/empty defaults', () => {
    const { result } = renderHook(() => useFile(), { wrapper: FileProvider })
    expect(result.current.fileData).toBeNull()
    expect(result.current.filename).toBe('')
    expect(result.current.fileType).toBeNull()
    expect(result.current.isModified).toBe(false)
  })

  it('loadFile sets fileData, filename, fileType and marks not modified', () => {
    const { result } = renderHook(() => useFile(), { wrapper: FileProvider })
    act(() => result.current.loadFile([['a', 'b']], 'test.csv', 'csv'))
    expect(result.current.fileData).toEqual([['a', 'b']])
    expect(result.current.filename).toBe('test.csv')
    expect(result.current.fileType).toBe('csv')
    expect(result.current.isModified).toBe(false)
  })

  it('updateData changes fileData and sets isModified', () => {
    const { result } = renderHook(() => useFile(), { wrapper: FileProvider })
    act(() => result.current.loadFile([['a']], 'test.csv', 'csv'))
    act(() => result.current.updateData([['b']]))
    expect(result.current.fileData).toEqual([['b']])
    expect(result.current.isModified).toBe(true)
  })

  it('resetFile clears all state back to defaults', () => {
    const { result } = renderHook(() => useFile(), { wrapper: FileProvider })
    act(() => result.current.loadFile([['a']], 'test.csv', 'csv'))
    act(() => result.current.updateData([['b']]))
    act(() => result.current.resetFile())
    expect(result.current.fileData).toBeNull()
    expect(result.current.filename).toBe('')
    expect(result.current.fileType).toBeNull()
    expect(result.current.isModified).toBe(false)
  })

  it('markSaved clears isModified', () => {
    const { result } = renderHook(() => useFile(), { wrapper: FileProvider })
    act(() => result.current.loadFile([['a']], 'test.csv', 'csv'))
    act(() => result.current.updateData([['b']]))
    expect(result.current.isModified).toBe(true)
    act(() => result.current.markSaved())
    expect(result.current.isModified).toBe(false)
  })

  it('detectFileType maps extensions correctly', () => {
    const { result } = renderHook(() => useFile(), { wrapper: FileProvider })
    expect(result.current.detectFileType('data.csv')).toBe('csv')
    expect(result.current.detectFileType('config.json')).toBe('json')
    expect(result.current.detectFileType('readme.md')).toBe('md')
    expect(result.current.detectFileType('readme.markdown')).toBe('md')
    expect(result.current.detectFileType('notes.txt')).toBe('txt')
    expect(result.current.detectFileType('file.xyz')).toBe('txt')
  })
})
