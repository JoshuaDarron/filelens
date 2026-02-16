import { createContext, useState, useRef, useCallback, useMemo } from 'react'

const defaultConfig = {
  visible: true,
  showSave: false,
  showExport: false,
  showAnalyze: false,
  stats: null,
  toolbarContent: null,
}

export const HeaderContext = createContext()

function shallowEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

export function HeaderProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const callbacksRef = useRef({ onSave: null, onExport: null, onAnalyze: null })

  const setHeaderConfig = useCallback((newConfig) => {
    // Separate callbacks from display config
    const { onSave, onExport, onAnalyze, ...displayConfig } = newConfig

    // Update callbacks ref (never triggers re-render)
    if (onSave !== undefined) callbacksRef.current.onSave = onSave
    if (onExport !== undefined) callbacksRef.current.onExport = onExport
    if (onAnalyze !== undefined) callbacksRef.current.onAnalyze = onAnalyze

    // Update display config with shallow equality guard
    setConfig(prev => {
      const merged = { ...prev, ...displayConfig }
      // Check shallow equality, with special handling for stats
      if (
        merged.visible === prev.visible &&
        merged.showSave === prev.showSave &&
        merged.showExport === prev.showExport &&
        merged.showAnalyze === prev.showAnalyze &&
        merged.toolbarContent === prev.toolbarContent &&
        shallowEqual(merged.stats, prev.stats)
      ) {
        return prev
      }
      return merged
    })
  }, [])

  const resetHeader = useCallback(() => {
    callbacksRef.current = { onSave: null, onExport: null, onAnalyze: null }
    setConfig(defaultConfig)
  }, [])

  const value = useMemo(() => ({
    config, callbacksRef, setHeaderConfig, resetHeader
  }), [config, setHeaderConfig, resetHeader])

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}
