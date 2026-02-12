import { useContext, useCallback } from 'react'
import { SettingsContext } from '../context/SettingsContext'

export function useAISettings() {
  const { settings, updateSetting } = useContext(SettingsContext)

  const setAIEnabled = useCallback((enabled) => {
    updateSetting('aiEnabled', enabled)
  }, [updateSetting])

  const setSelectedModel = useCallback((modelId) => {
    updateSetting('selectedModel', modelId)
  }, [updateSetting])

  return {
    aiEnabled: settings.aiEnabled,
    setAIEnabled,
    selectedModel: settings.selectedModel,
    setSelectedModel,
  }
}
