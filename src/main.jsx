import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SettingsProvider } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { FileProvider } from './context/FileContext'
import { AIProvider } from './context/AIContext'
import { OptionsHeaderProvider } from './context/OptionsHeaderContext'
import { OptionsHeaderPortalProvider } from './context/OptionsHeaderPortalContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <AIProvider>
            <FileProvider>
              <OptionsHeaderProvider>
                <OptionsHeaderPortalProvider>
                  <App />
                </OptionsHeaderPortalProvider>
              </OptionsHeaderProvider>
            </FileProvider>
          </AIProvider>
        </ToastProvider>
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>
)
