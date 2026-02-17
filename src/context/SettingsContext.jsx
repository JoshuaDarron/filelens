import { createContext, useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'filelens-settings'

const defaultSettings = {
  theme: 'system',
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch { /* ignore */ }

  // Migrate from old theme key
  const oldTheme = localStorage.getItem('csvEditor-theme')
  if (oldTheme) {
    const migrated = { ...defaultSettings, theme: oldTheme }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    localStorage.removeItem('csvEditor-theme')
    return migrated
  }

  return defaultSettings
}

export const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <SettingsContext.Provider value={useMemo(() => ({ settings, updateSetting }), [settings, updateSetting])}>
      {children}
    </SettingsContext.Provider>
  )
}
