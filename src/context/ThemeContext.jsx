import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSettings } from '../hooks/useSettings'

export const ThemeContext = createContext(null)

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(preference) {
  if (preference === 'system') return getSystemTheme()
  return preference
}

export function ThemeProvider({ children }) {
  const { settings, updateSetting } = useSettings()
  const themePreference = settings.theme || 'system'
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(themePreference))
  const resolvedThemeRef = useRef(resolvedTheme)

  // Resolve theme whenever preference changes
  useEffect(() => {
    const next = resolveTheme(themePreference)
    resolvedThemeRef.current = next
    setResolvedTheme(next)
  }, [themePreference])

  // Listen for OS theme changes when set to "system"
  useEffect(() => {
    if (themePreference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const next = getSystemTheme()
      resolvedThemeRef.current = next
      setResolvedTheme(next)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themePreference])

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    document.documentElement.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  }, [resolvedTheme])

  // Enable theme transition animation only after initial render
  useEffect(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('theme-ready')
    })
  }, [])

  const setTheme = useCallback((value) => {
    updateSetting('theme', value)
  }, [updateSetting])

  const toggleTheme = useCallback(() => {
    const next = resolvedThemeRef.current === 'light' ? 'dark' : 'light'
    updateSetting('theme', next)
  }, [updateSetting])

  const value = useMemo(() => ({
    theme: resolvedTheme,
    themePreference,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  }), [resolvedTheme, themePreference, setTheme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
