import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { OptionsHeaderPortalContext, OptionsHeaderPortalProvider } from './OptionsHeaderPortalContext'

function usePortal() {
  return useContext(OptionsHeaderPortalContext)
}

describe('OptionsHeaderPortalContext', () => {
  it('portalTarget starts null', () => {
    const { result } = renderHook(() => usePortal(), { wrapper: OptionsHeaderPortalProvider })
    expect(result.current.portalTarget).toBeNull()
  })

  it('registerRef updates portalTarget', () => {
    const { result } = renderHook(() => usePortal(), { wrapper: OptionsHeaderPortalProvider })
    const node = document.createElement('div')
    act(() => result.current.registerRef(node))
    expect(result.current.portalTarget).toBe(node)
  })

  it('registerRef can clear portalTarget with null', () => {
    const { result } = renderHook(() => usePortal(), { wrapper: OptionsHeaderPortalProvider })
    const node = document.createElement('div')
    act(() => result.current.registerRef(node))
    expect(result.current.portalTarget).toBe(node)

    act(() => result.current.registerRef(null))
    expect(result.current.portalTarget).toBeNull()
  })
})
