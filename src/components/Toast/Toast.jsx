import { useEffect, useRef } from 'react'
import './Toast.css'

export function Toast({ toast, onClose }) {
  const progressRef = useRef(null)

  useEffect(() => {
    if (toast.showProgress && progressRef.current) {
      requestAnimationFrame(() => {
        if (progressRef.current) {
          progressRef.current.style.transitionDuration = `${toast.duration}ms`
          progressRef.current.style.transform = 'translateX(0)'
        }
      })
    }
  }, [toast.showProgress, toast.duration])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <i className="bi bi-check-circle-fill"></i>
      case 'error':
        return <i className="bi bi-exclamation-triangle-fill"></i>
      case 'loading':
        return <div className="toast-spinner"></div>
      default:
        return <i className="bi bi-info-circle-fill"></i>
    }
  }

  const className = `toast ${toast.type}${toast.isHiding ? ' hide' : ' show'}`

  return (
    <div className={className} data-toast-id={toast.id}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      {toast.closable && (
        <button className="toast-close" onClick={() => onClose(toast.id)}>
          <i className="bi bi-x"></i>
        </button>
      )}
      {toast.showProgress && (
        <div className="toast-progress">
          <div ref={progressRef} className="toast-progress-bar"></div>
        </div>
      )}
    </div>
  )
}
