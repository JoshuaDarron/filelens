import { useState, useRef, useEffect, useCallback } from 'react'
import './Breadcrumb.css'

export function Breadcrumb({ items, onNavigate }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const closeDropdown = useCallback(() => setDropdownOpen(false), [])

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!dropdownOpen) return

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown()
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeDropdown()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [dropdownOpen, closeDropdown])

  if (!items || items.length === 0) return null

  const renderSegment = (item, originalIndex, showSeparator) => {
    const isLast = originalIndex === items.length - 1
    return (
      <span key={originalIndex} className="breadcrumb-segment">
        {showSeparator && <span className="breadcrumb-separator">/</span>}
        {isLast ? (
          <span className="breadcrumb-item current">
            {item.name}
          </span>
        ) : item.url ? (
          <a className="breadcrumb-item" href={item.url}>
            {originalIndex === 0 && <i className="bi bi-folder2"></i>}
            {item.name}
          </a>
        ) : (
          <span
            className="breadcrumb-item"
            onClick={() => onNavigate && onNavigate(originalIndex)}
          >
            {originalIndex === 0 && <i className="bi bi-folder2"></i>}
            {item.name}
          </span>
        )}
      </span>
    )
  }

  // No truncation needed for 5 or fewer segments
  if (items.length <= 5) {
    return (
      <div className="breadcrumb">
        {items.map((item, index) => renderSegment(item, index, index > 0))}
      </div>
    )
  }

  // Truncate: show first 2, ellipsis dropdown, last 2
  const headItems = items.slice(0, 2)
  const hiddenItems = items.slice(2, items.length - 2)
  const tailItems = items.slice(items.length - 2)

  return (
    <div className="breadcrumb">
      {headItems.map((item, i) => renderSegment(item, i, i > 0))}

      <span className="breadcrumb-segment">
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-ellipsis-wrapper" ref={dropdownRef}>
          <span
            className="breadcrumb-item breadcrumb-ellipsis"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            &hellip;
          </span>
          {dropdownOpen && (
            <div className="breadcrumb-dropdown">
              {hiddenItems.map((item, i) => {
                const originalIndex = i + 2
                return item.url ? (
                  <a
                    key={originalIndex}
                    className="breadcrumb-dropdown-link"
                    href={item.url}
                  >
                    {item.name}
                  </a>
                ) : (
                  <span
                    key={originalIndex}
                    className="breadcrumb-dropdown-link"
                    onClick={() => {
                      onNavigate && onNavigate(originalIndex)
                      closeDropdown()
                    }}
                  >
                    {item.name}
                  </span>
                )
              })}
            </div>
          )}
        </span>
      </span>

      {tailItems.map((item, i) => {
        const originalIndex = items.length - 2 + i
        return renderSegment(item, originalIndex, true)
      })}
    </div>
  )
}
