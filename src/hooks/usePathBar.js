import { useContext, useLayoutEffect, useRef } from 'react'
import { PathBarContext } from '../context/PathBarContext'

export function usePathBar(config = {}) {
  const { setPathBarConfig, callbacksRef } = useContext(PathBarContext)
  const prevConfigRef = useRef(null)

  // Sync callbacks to ref on every render (always current, never stale)
  const { breadcrumbOnNavigate } = config
  callbacksRef.current.breadcrumbOnNavigate = breadcrumbOnNavigate || null

  // Sync display config via useLayoutEffect so it applies before paint
  const {
    visible = true,
    breadcrumbItems = null,
  } = config

  useLayoutEffect(() => {
    const displayConfig = { visible, breadcrumbItems }

    const prev = prevConfigRef.current
    if (
      prev &&
      prev.visible === visible &&
      prev.breadcrumbItems === breadcrumbItems
    ) {
      return
    }
    prevConfigRef.current = displayConfig
    setPathBarConfig(displayConfig)
  }, [visible, breadcrumbItems, setPathBarConfig])
}
