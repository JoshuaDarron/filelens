import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { ThemeContext, ThemeProvider } from './ThemeContext'
import { SettingsProvider } from './SettingsContext'

function useTheme() {
  return useContext(ThemeContext)
}

function wrapper({ children }) {
  return (
    <SettingsProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SettingsProvider>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    // jsdom doesn't provide matchMedia — mock it
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('defaults to light theme when no localStorage value', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    // With 'system' default and jsdom (no dark mode), resolves to 'light'
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('reads saved theme from localStorage', () => {
    localStorage.setItem('filelens-settings', JSON.stringify({ theme: 'dark' }))
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('toggleTheme switches light to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('toggleTheme switches dark to light', () => {
    localStorage.setItem('filelens-settings', JSON.stringify({ theme: 'dark' }))
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('persists theme to localStorage on change', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggleTheme())
    const stored = JSON.parse(localStorage.getItem('filelens-settings'))
    expect(stored.theme).toBe('dark')
  })

  it('sets data-theme attribute on documentElement', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    act(() => result.current.toggleTheme())
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
