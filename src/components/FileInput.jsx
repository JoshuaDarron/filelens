import { useRef } from 'react'

export function FileInput({
  onFileSelect,
  accept = '.csv,.txt,.json,.md',
  children,
  className = 'btn btn-primary'
}) {
  const inputRef = useRef(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect?.(file)
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button className={className} onClick={handleClick}>
        {children || (
          <>
            <i className="bi bi-folder2-open"></i> Open File
          </>
        )}
      </button>
    </>
  )
}
