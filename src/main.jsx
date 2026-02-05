import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { FileProvider } from './context/FileContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <FileProvider>
          <App />
        </FileProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
)
