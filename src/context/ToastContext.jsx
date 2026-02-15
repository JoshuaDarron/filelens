import { createContext, useState, useCallback, useRef, useMemo } from 'react'

export const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)
  const timeoutsRef = useRef(new Map())

  const hideToast = useCallback((id) => {
    // Clear timeout if exists
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id))
      timeoutsRef.current.delete(id)
    }

    // Mark toast as hiding
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, isHiding: true } : t
    ))

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  const showToast = useCallback((options = {}) => {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000,
      showProgress = true,
      closable = true,
      id = null
    } = options

    // If it's a loading toast with an ID, remove existing loading toast with same ID
    if (type === 'loading' && id) {
      setToasts(prev => prev.filter(t => t.id !== id))
    }

    const toastId = id || `toast-${++toastIdRef.current}`

    const newToast = {
      id: toastId,
      type,
      title,
      message,
      duration,
      showProgress: showProgress && duration > 0 && type !== 'loading',
      closable,
      isHiding: false,
      createdAt: Date.now()
    }

    setToasts(prev => [...prev, newToast])

    // Auto hide (except for loading toasts)
    if (duration > 0 && type !== 'loading') {
      const timeout = setTimeout(() => {
        hideToast(toastId)
      }, duration)
      timeoutsRef.current.set(toastId, timeout)
    }

    return toastId
  }, [hideToast])

  const success = useCallback((message, title = 'Success', options = {}) => {
    return showToast({ type: 'success', title, message, ...options })
  }, [showToast])

  const error = useCallback((message, title = 'Error', options = {}) => {
    return showToast({ type: 'error', title, message, duration: 7000, ...options })
  }, [showToast])

  const loading = useCallback((message, title = 'Loading', options = {}) => {
    return showToast({ type: 'loading', title, message, duration: 0, showProgress: false, ...options })
  }, [showToast])

  const info = useCallback((message, title = 'Info', options = {}) => {
    return showToast({ type: 'info', title, message, ...options })
  }, [showToast])

  const update = useCallback((toastId, options = {}) => {
    hideToast(toastId)
    return showToast({ ...options, id: toastId })
  }, [hideToast, showToast])

  const clear = useCallback(() => {
    toasts.forEach(toast => hideToast(toast.id))
  }, [toasts, hideToast])

  const value = useMemo(() => ({
    toasts,
    show: showToast,
    hide: hideToast,
    success,
    error,
    loading,
    info,
    update,
    clear
  }), [toasts, showToast, hideToast, success, error, loading, info, update, clear])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}
