import { useState, useCallback } from 'react'

export function DropZone({
  onFileDrop,
  onClick,
  acceptedExtensions = ['.csv', '.txt', '.json', '.md'],
  children
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const isValidFile = useCallback((file) => {
    return acceptedExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )
  }, [acceptedExtensions])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]

      if (isValidFile(file)) {
        let handle = null
        if (e.dataTransfer.items?.[0]?.getAsFileSystemHandle) {
          try {
            const h = await e.dataTransfer.items[0].getAsFileSystemHandle()
            if (h.kind === 'file') {
              handle = h
            }
          } catch {
            // Handle not available
          }
        }
        onFileDrop?.(file, handle)
      }
    }
  }

  const handleClick = () => {
    onClick?.()
  }

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {children || (
        <div className="drop-zone-content">
          <div className="drop-icon"><i className="bi bi-cloud-upload"></i></div>
          <div className="drop-text">Drop your file here</div>
          <div className="drop-subtext">or click to browse files</div>
          <div className="btn btn-primary">
            <i className="bi bi-file-earmark-plus"></i> Choose File
          </div>
        </div>
      )}
    </div>
  )
}
