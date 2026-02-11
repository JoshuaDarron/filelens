import { useContext, useCallback } from 'react'
import { SettingsContext } from '../context/SettingsContext'

export function useAISettings() {
  const { settings, updateSetting } = useContext(SettingsContext)

  const setAIEnabled = useCallback((enabled) => {
    updateSetting('aiEnabled', enabled)
  }, [updateSetting])

  return {
    aiEnabled: settings.aiEnabled,
    setAIEnabled,
  }
}
