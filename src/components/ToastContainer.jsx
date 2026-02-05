import { useToast } from '../hooks/useToast'
import { Toast } from './Toast'

export function ToastContainer() {
  const { toasts, hide } = useToast()

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={hide} />
      ))}
    </div>
  )
}
