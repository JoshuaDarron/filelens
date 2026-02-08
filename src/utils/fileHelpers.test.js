import { describe, it, expect } from 'vitest'
import { formatFileSize, getFileExtension, getFileType, getMimeType } from './fileHelpers'

describe('formatFileSize', () => {
  it('returns "0 Bytes" for 0', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })

  it('formats small byte values', () => {
    expect(formatFileSize(500)).toBe('500 Bytes')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(2621440)).toBe('2.5 MB')
  })

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })
})

describe('getFileExtension', () => {
  it('returns extension for normal filename', () => {
    expect(getFileExtension('file.csv')).toBe('csv')
  })

  it('lowercases uppercase extensions', () => {
    expect(getFileExtension('FILE.CSV')).toBe('csv')
  })

  it('returns the last extension segment for dotfiles', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore')
  })

  it('handles files with no extension', () => {
    expect(getFileExtension('makefile')).toBe('makefile')
  })
})

describe('getFileType', () => {
  it('maps csv to csv', () => {
    expect(getFileType('data.csv')).toBe('csv')
  })

  it('maps json to json', () => {
    expect(getFileType('config.json')).toBe('json')
  })

  it('maps md to md', () => {
    expect(getFileType('readme.md')).toBe('md')
  })

  it('maps markdown to md', () => {
    expect(getFileType('readme.markdown')).toBe('md')
  })

  it('maps txt to txt', () => {
    expect(getFileType('notes.txt')).toBe('txt')
  })

  it('maps unknown extensions to txt', () => {
    expect(getFileType('file.xyz')).toBe('txt')
  })
})

describe('getMimeType', () => {
  it('maps csv to text/csv', () => {
    expect(getMimeType('csv')).toBe('text/csv')
  })

  it('maps json to application/json', () => {
    expect(getMimeType('json')).toBe('application/json')
  })

  it('maps txt to text/plain', () => {
    expect(getMimeType('txt')).toBe('text/plain')
  })

  it('maps md to text/plain', () => {
    expect(getMimeType('md')).toBe('text/plain')
  })
})
