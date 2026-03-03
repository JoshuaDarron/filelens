import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { SettingsContext, SettingsProvider } from './SettingsContext'

function useSettings() {
  return useContext(SettingsContext)
}

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings).toEqual({
      theme: 'system',
      lastViewer: null,
      viewModes: {},
    })
  })

  it('reads and merges saved settings from localStorage', () => {
    localStorage.setItem('filelens-settings', JSON.stringify({ theme: 'dark', customKey: 'val' }))
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings.theme).toBe('dark')
    expect(result.current.settings.lastViewer).toBeNull()
    expect(result.current.settings.viewModes).toEqual({})
    expect(result.current.settings.customKey).toBe('val')
  })

  it('updateSetting persists to localStorage', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    act(() => result.current.updateSetting('theme', 'dark'))
    expect(result.current.settings.theme).toBe('dark')

    const stored = JSON.parse(localStorage.getItem('filelens-settings'))
    expect(stored.theme).toBe('dark')
  })

  it('migrates from old csvEditor-theme key and removes it', () => {
    localStorage.setItem('csvEditor-theme', 'dark')
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings.theme).toBe('dark')
    expect(localStorage.getItem('csvEditor-theme')).toBeNull()
    expect(localStorage.getItem('filelens-settings')).toBeTruthy()
  })

  it('does not migrate when filelens-settings already exists', () => {
    localStorage.setItem('csvEditor-theme', 'dark')
    localStorage.setItem('filelens-settings', JSON.stringify({ theme: 'light' }))
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings.theme).toBe('light')
    // Old key is not removed when new settings exist
    expect(localStorage.getItem('csvEditor-theme')).toBe('dark')
  })

  it('handles corrupted JSON gracefully and falls back to defaults', () => {
    localStorage.setItem('filelens-settings', '{invalid json')
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings).toEqual({
      theme: 'system',
      lastViewer: null,
      viewModes: {},
    })
  })

  it('updateSetting preserves other settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    act(() => result.current.updateSetting('theme', 'dark'))
    act(() => result.current.updateSetting('lastViewer', 'json'))
    expect(result.current.settings.theme).toBe('dark')
    expect(result.current.settings.lastViewer).toBe('json')
  })

  it('updateSetting can store complex values', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    act(() => result.current.updateSetting('viewModes', { csv: 'table', json: 'tree' }))
    expect(result.current.settings.viewModes).toEqual({ csv: 'table', json: 'tree' })
  })
})
