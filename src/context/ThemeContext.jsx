import { createContext, useState, useEffect, useCallback } from 'react'
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

  // Resolve theme whenever preference changes
  useEffect(() => {
    setResolvedTheme(resolveTheme(themePreference))
  }, [themePreference])

  // Listen for OS theme changes when set to "system"
  useEffect(() => {
    if (themePreference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setResolvedTheme(getSystemTheme())
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
    const next = resolvedTheme === 'light' ? 'dark' : 'light'
    updateSetting('theme', next)
  }, [resolvedTheme, updateSetting])

  const value = {
    theme: resolvedTheme,
    themePreference,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
