import { createContext, useState, useRef, useCallback, useMemo } from 'react'

const defaultConfig = {
  visible: true,
  breadcrumbItems: null,
}

export const OptionsHeaderContext = createContext()

export function OptionsHeaderProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const callbacksRef = useRef({ breadcrumbOnNavigate: null })

  const setOptionsHeaderConfig = useCallback((newConfig) => {
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

  const resetOptionsHeader = useCallback(() => {
    callbacksRef.current = { breadcrumbOnNavigate: null }
    setConfig(defaultConfig)
  }, [])

  const value = useMemo(() => ({
    config, callbacksRef, setOptionsHeaderConfig, resetOptionsHeader
  }), [config, setOptionsHeaderConfig, resetOptionsHeader])

  return (
    <OptionsHeaderContext.Provider value={value}>
      {children}
    </OptionsHeaderContext.Provider>
  )
}
