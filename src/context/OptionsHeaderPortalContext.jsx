import { createContext, useState, useCallback, useMemo } from 'react'

export const OptionsHeaderPortalContext = createContext()

export function OptionsHeaderPortalProvider({ children }) {
  const [portalTarget, setPortalTarget] = useState(null)

  const registerRef = useCallback((node) => {
    setPortalTarget(node)
  }, [])

  const value = useMemo(() => ({
    portalTarget, registerRef
  }), [portalTarget, registerRef])

  return (
    <OptionsHeaderPortalContext.Provider value={value}>
      {children}
    </OptionsHeaderPortalContext.Provider>
  )
}
