import { createContext, useState, useCallback, useMemo } from 'react'

export const PathBarPortalContext = createContext()

export function PathBarPortalProvider({ children }) {
  const [portalTarget, setPortalTarget] = useState(null)

  const registerRef = useCallback((node) => {
    setPortalTarget(node)
  }, [])

  const value = useMemo(() => ({
    portalTarget, registerRef
  }), [portalTarget, registerRef])

  return (
    <PathBarPortalContext.Provider value={value}>
      {children}
    </PathBarPortalContext.Provider>
  )
}
