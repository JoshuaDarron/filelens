import { useContext } from 'react'
import { createPortal } from 'react-dom'
import { OptionsHeaderPortalContext } from '../context/OptionsHeaderPortalContext'

export function useOptionsHeaderPortal() {
  const { portalTarget } = useContext(OptionsHeaderPortalContext)
  return {
    renderControls: (content) => portalTarget ? createPortal(content, portalTarget) : null
  }
}
