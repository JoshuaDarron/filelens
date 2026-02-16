import { useContext, useLayoutEffect, useRef } from 'react'
import { HeaderContext } from '../context/HeaderContext'

export function useHeader(config = {}) {
  const { setHeaderConfig, callbacksRef } = useContext(HeaderContext)
  const prevConfigRef = useRef(null)

  // Sync callbacks to ref on every render (always current, never stale)
  const { onSave, onExport, onAnalyze } = config
  callbacksRef.current.onSave = onSave || null
  callbacksRef.current.onExport = onExport || null
  callbacksRef.current.onAnalyze = onAnalyze || null

  // Sync display config via useLayoutEffect so it applies before paint
  const {
    visible = true,
    showSave = false,
    showExport = false,
    showAnalyze = false,
    stats = null,
    toolbarContent = null,
  } = config

  useLayoutEffect(() => {
    const displayConfig = { visible, showSave, showExport, showAnalyze, stats, toolbarContent }

    // Quick check against prev to avoid calling setHeaderConfig unnecessarily
    const prev = prevConfigRef.current
    if (
      prev &&
      prev.visible === visible &&
      prev.showSave === showSave &&
      prev.showExport === showExport &&
      prev.showAnalyze === showAnalyze &&
      prev.stats === stats &&
      prev.toolbarContent === toolbarContent
    ) {
      return
    }
    prevConfigRef.current = displayConfig
    setHeaderConfig(displayConfig)
  }, [visible, showSave, showExport, showAnalyze, stats, toolbarContent, setHeaderConfig])
}
