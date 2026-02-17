import { useContext, useLayoutEffect, useRef } from 'react'
import { OptionsHeaderContext } from '../context/OptionsHeaderContext'

export function useOptionsHeader(config = {}) {
  const { setOptionsHeaderConfig, callbacksRef } = useContext(OptionsHeaderContext)
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
    setOptionsHeaderConfig(displayConfig)
  }, [visible, breadcrumbItems, setOptionsHeaderConfig])
}
