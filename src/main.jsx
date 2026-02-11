import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SettingsProvider } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { FileProvider } from './context/FileContext'
import { AIProvider } from './context/AIContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <AIProvider>
            <FileProvider>
              <App />
            </FileProvider>
          </AIProvider>
        </ToastProvider>
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>
)
