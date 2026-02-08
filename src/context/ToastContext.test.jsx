import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContext } from 'react'
import { ToastContext, ToastProvider } from './ToastContext'

function useToast() {
  return useContext(ToastContext)
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('success creates a toast with correct type', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })
    act(() => result.current.success('Done'))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[0].message).toBe('Done')
  })

  it('error creates a toast with correct type and 7000ms duration', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })
    act(() => result.current.error('Failed'))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('error')
    expect(result.current.toasts[0].duration).toBe(7000)
  })

  it('info creates a toast with correct type', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })
    act(() => result.current.info('Note'))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('info')
  })

  it('loading creates a toast with duration 0 and no progress bar', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })
    act(() => result.current.loading('Please wait'))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('loading')
    expect(result.current.toasts[0].duration).toBe(0)
    expect(result.current.toasts[0].showProgress).toBe(false)
  })

  it('hide removes a specific toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })
    let toastId
    act(() => { toastId = result.current.success('A') })
    act(() => result.current.success('B'))
    expect(result.current.toasts).toHaveLength(2)

    act(() => result.current.hide(toastId))
    // After hide, toast is marked as hiding
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('B')
  })

  it('clear removes all toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })
    act(() => result.current.success('A'))
    act(() => result.current.info('B'))
    act(() => result.current.error('C'))
    expect(result.current.toasts).toHaveLength(3)

    act(() => result.current.clear())
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current.toasts).toHaveLength(0)
  })
})
