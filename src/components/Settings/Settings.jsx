import { useState, useCallback } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../../hooks/useToast'
import { version } from '../../../package.json'
import './Settings.css'

const themeOptions = [
  { value: 'light', label: 'Light', icon: 'bi-sun-fill' },
  { value: 'dark', label: 'Dark', icon: 'bi-moon-fill' },
  { value: 'system', label: 'System', icon: 'bi-circle-half' },
]

const STORAGE_KEYS = [
  { key: 'filelens-settings', label: 'Settings' },
  { key: 'fileBrowser-viewMode', label: 'File browser preferences' },
  { key: 'csvEditor-theme', label: 'Legacy theme (migrated)' },
]

function getStorageUsage() {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    total += key.length + (localStorage.getItem(key)?.length || 0)
  }
  return total
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function Settings() {
  const { themePreference, setTheme } = useTheme()
  const toast = useToast()
  const [storageBytes, setStorageBytes] = useState(getStorageUsage)

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.search = '?type=directory'
    }
  }

  const handleClearData = useCallback(() => {
    const currentTheme = themePreference
    STORAGE_KEYS.forEach(({ key }) => localStorage.removeItem(key))
    // Restore theme preference so the page doesn't flash
    localStorage.setItem('filelens-settings', JSON.stringify({ theme: currentTheme }))
    setStorageBytes(getStorageUsage())
    toast.success('Cached data cleared')
  }, [themePreference, toast])

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="btn btn-outline settings-back-btn" onClick={handleBack}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="settings-title">Settings</h1>
      </header>

      <div className="settings-body">
        {/* Appearance */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            <i className="bi bi-palette"></i>
            Appearance
          </h2>
          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Theme</span>
              <span className="settings-option-desc">Choose how FileLens looks</span>
            </div>
            <div className="theme-selector">
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`theme-option ${themePreference === opt.value ? 'active' : ''}`}
                  onClick={() => setTheme(opt.value)}
                >
                  <i className={`bi ${opt.icon}`}></i>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy & Data */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            <i className="bi bi-shield-lock"></i>
            Privacy & Data
          </h2>
          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Local storage usage</span>
              <span className="settings-option-desc">
                FileLens stores preferences locally in your browser — no data is sent externally
              </span>
            </div>
            <span className="settings-storage-badge">{formatBytes(storageBytes)}</span>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-option">
            <div className="settings-option-info">
              <span className="settings-option-label">Clear cached data</span>
              <span className="settings-option-desc">
                Reset all preferences except your current theme
              </span>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleClearData}>
              <i className="bi bi-trash3"></i> Clear
            </button>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h2 className="settings-section-title">
            <i className="bi bi-info-circle"></i>
            About
          </h2>
          <div className="about-grid">
            <div className="about-row">
              <span className="about-label">Version</span>
              <span className="about-value">{version}</span>
            </div>
            <div className="about-row">
              <span className="about-label">Platform</span>
              <span className="about-value">Chrome Extension (Manifest V3)</span>
            </div>
            <div className="about-row">
              <span className="about-label">Source</span>
              <a
                className="about-link"
                href="https://github.com/joshuadarron/filelens"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <i className="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
            <div className="about-row">
              <span className="about-label">License</span>
              <span className="about-value">MIT</span>
            </div>
          </div>
          <p className="about-tagline">
            View, edit, and export CSV, JSON, TXT, and Markdown files — right in your browser.
          </p>
        </section>
      </div>
    </div>
  )
}
