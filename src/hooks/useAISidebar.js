import { useState, useCallback, useEffect } from 'react'

export function useAISidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarContent, setSidebarContent] = useState(null)
  const [activeTab, setActiveTab] = useState('search')

  const openSidebar = useCallback((content = null) => {
    if (content) setSidebarContent(content)
    setIsSidebarOpen(true)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const updateContent = useCallback((content) => {
    setSidebarContent(content)
  }, [])

  // Keyboard shortcut: Ctrl+Shift+A toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  return {
    isSidebarOpen,
    sidebarContent,
    activeTab,
    setActiveTab,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    updateContent,
  }
}
