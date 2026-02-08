import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { ThemeContext, ThemeProvider } from './ThemeContext'

function useTheme() {
  return useContext(ThemeContext)
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to light theme when no localStorage value', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('reads saved theme from localStorage', () => {
    localStorage.setItem('csvEditor-theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('toggleTheme switches light to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('toggleTheme switches dark to light', () => {
    localStorage.setItem('csvEditor-theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('persists theme to localStorage on change', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('csvEditor-theme')).toBe('dark')
  })

  it('sets data-theme attribute on documentElement', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    act(() => result.current.toggleTheme())
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
