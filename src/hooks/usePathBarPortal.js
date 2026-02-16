import { useContext } from 'react'
import { createPortal } from 'react-dom'
import { PathBarPortalContext } from '../context/PathBarPortalContext'

export function usePathBarPortal() {
  const { portalTarget } = useContext(PathBarPortalContext)
  return {
    renderControls: (content) => portalTarget ? createPortal(content, portalTarget) : null
  }
}
