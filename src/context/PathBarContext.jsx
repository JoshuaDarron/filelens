import { createContext, useState, useRef, useCallback, useMemo } from 'react'

const defaultConfig = {
  visible: true,
  breadcrumbItems: null,
}

export const PathBarContext = createContext()

export function PathBarProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const callbacksRef = useRef({ breadcrumbOnNavigate: null })

  const setPathBarConfig = useCallback((newConfig) => {
    const { breadcrumbOnNavigate, ...displayConfig } = newConfig

    if (breadcrumbOnNavigate !== undefined) callbacksRef.current.breadcrumbOnNavigate = breadcrumbOnNavigate

    setConfig(prev => {
      const merged = { ...prev, ...displayConfig }
      if (
        merged.visible === prev.visible &&
        merged.breadcrumbItems === prev.breadcrumbItems
      ) {
        return prev
      }
      return merged
    })
  }, [])

  const resetPathBar = useCallback(() => {
    callbacksRef.current = { breadcrumbOnNavigate: null }
    setConfig(defaultConfig)
  }, [])

  const value = useMemo(() => ({
    config, callbacksRef, setPathBarConfig, resetPathBar
  }), [config, setPathBarConfig, resetPathBar])

  return (
    <PathBarContext.Provider value={value}>
      {children}
    </PathBarContext.Provider>
  )
}
