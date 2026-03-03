import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { OptionsHeaderContext, OptionsHeaderProvider } from './OptionsHeaderContext'

function useOptionsHeader() {
  return useContext(OptionsHeaderContext)
}

describe('OptionsHeaderContext', () => {
  it('provides default config values', () => {
    const { result } = renderHook(() => useOptionsHeader(), { wrapper: OptionsHeaderProvider })
    expect(result.current.config).toEqual({
      visible: true,
      breadcrumbItems: null,
    })
  })

  it('setOptionsHeaderConfig merges config', () => {
    const { result } = renderHook(() => useOptionsHeader(), { wrapper: OptionsHeaderProvider })
    act(() => result.current.setOptionsHeaderConfig({ breadcrumbItems: ['a', 'b'] }))
    expect(result.current.config.breadcrumbItems).toEqual(['a', 'b'])
    expect(result.current.config.visible).toBe(true)
  })

  it('preserves referential equality when values are unchanged', () => {
    const { result } = renderHook(() => useOptionsHeader(), { wrapper: OptionsHeaderProvider })
    const configBefore = result.current.config
    act(() => result.current.setOptionsHeaderConfig({ visible: true, breadcrumbItems: null }))
    expect(result.current.config).toBe(configBefore)
  })

  it('resetOptionsHeader returns defaults', () => {
    const { result } = renderHook(() => useOptionsHeader(), { wrapper: OptionsHeaderProvider })
    act(() => result.current.setOptionsHeaderConfig({ visible: false, breadcrumbItems: ['x'] }))
    expect(result.current.config.visible).toBe(false)

    act(() => result.current.resetOptionsHeader())
    expect(result.current.config).toEqual({
      visible: true,
      breadcrumbItems: null,
    })
  })

  it('stores breadcrumbOnNavigate callback in callbacksRef', () => {
    const { result } = renderHook(() => useOptionsHeader(), { wrapper: OptionsHeaderProvider })
    const fn = () => {}
    act(() => result.current.setOptionsHeaderConfig({ breadcrumbOnNavigate: fn }))
    expect(result.current.callbacksRef.current.breadcrumbOnNavigate).toBe(fn)
  })
})
