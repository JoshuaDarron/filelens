import { memo, useContext, useMemo } from 'react'
import { HeaderContext } from '../../context/HeaderContext'
import { Breadcrumb } from '../Breadcrumb/Breadcrumb'
import './PathBar.css'

export const PathBar = memo(function PathBar() {
  const { config, callbacksRef } = useContext(HeaderContext)
  const { visible, breadcrumbItems, pathBarContent } = config

  // Auto-derive breadcrumbs from URL params when breadcrumbItems is not explicitly set
  const autoBreadcrumbs = useMemo(() => {
    if (breadcrumbItems) return null // Will use explicit items instead
    const params = new URLSearchParams(window.location.search)
    const fileUrl = params.get('url')
    const type = params.get('type')
    if (!fileUrl || type === 'directory') return null
    try {
      const parsed = new URL(fileUrl)
      if (parsed.protocol !== 'file:') return null

      const pathname = decodeURIComponent(parsed.pathname)
      const segments = pathname.split('/').filter(Boolean)
      const crumbs = []

      for (let i = 0; i < segments.length - 1; i++) {
        const pathUpTo = '/' + segments.slice(0, i + 1).join('/') + '/'
        const dirUrl = `file://${pathUpTo}`
        crumbs.push({
          name: segments[i],
          url: `${window.location.pathname}?url=${encodeURIComponent(dirUrl)}&type=directory`
        })
      }

      if (segments.length > 0) {
        crumbs.push({ name: segments[segments.length - 1], url: null })
      }

      return crumbs
    } catch {
      return null
    }
  }, [breadcrumbItems])

  if (!visible) return null

  const items = breadcrumbItems || autoBreadcrumbs
  const onNavigate = breadcrumbItems ? callbacksRef.current.breadcrumbOnNavigate : undefined

  if (!items && !pathBarContent) return null

  if (pathBarContent) {
    return (
      <div className="browser-path-bar">
        <Breadcrumb items={items} onNavigate={onNavigate} />
        <div className="browser-path-controls">
          {pathBarContent}
        </div>
      </div>
    )
  }

  return <Breadcrumb items={items} onNavigate={onNavigate} />
})
