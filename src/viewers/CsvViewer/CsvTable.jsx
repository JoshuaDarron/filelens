import { useState, useRef, useCallback, useEffect } from 'react'

export function CsvTable({
  data,
  startIndex,
  endIndex,
  onCellEdit,
  onPaste
}) {
  const [columnWidths, setColumnWidths] = useState([])
  const [isResizing, setIsResizing] = useState(false)
  const tableRef = useRef(null)

  const headers = data[0] || []
  const rows = data.slice(startIndex + 1, endIndex + 1)

  const initResize = useCallback((colIndex, startX) => {
    const th = tableRef.current?.querySelector(`th:nth-child(${colIndex + 1})`)
    if (!th) return

    const startWidth = th.offsetWidth

    // Initialize column widths if not set
    if (!columnWidths.some(w => w)) {
      const allThs = tableRef.current?.querySelectorAll('th')
      if (allThs) {
        const widths = Array.from(allThs).map(header => header.offsetWidth)
        setColumnWidths(widths)
        allThs.forEach((header, i) => {
          header.style.width = widths[i] + 'px'
        })
        if (tableRef.current) {
          tableRef.current.style.tableLayout = 'fixed'
        }
      }
    }

    setIsResizing(true)
    document.body.classList.add('col-resizing')

    const onMouseMove = (e) => {
      const delta = e.clientX - startX
      const newWidth = Math.max(60, startWidth + delta)

      setColumnWidths(prev => {
        const updated = [...prev]
        updated[colIndex] = newWidth
        return updated
      })

      th.style.width = newWidth + 'px'

      // Update body cell widths
      const tbody = tableRef.current?.querySelector('tbody')
      if (tbody) {
        const rows = tbody.querySelectorAll('tr')
        rows.forEach(row => {
          const cell = row.children[colIndex]
          if (cell) {
            cell.style.width = newWidth + 'px'
          }
        })
      }
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.classList.remove('col-resizing')
      setIsResizing(false)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [columnWidths])

  const handleCellChange = useCallback((rowIndex, colIndex, value) => {
    // rowIndex is relative to visible rows, need to adjust for actual data index
    const actualRowIndex = startIndex + rowIndex + 1
    onCellEdit?.(actualRowIndex, colIndex, value)
  }, [startIndex, onCellEdit])

  const handleKeyDown = useCallback((e, rowIndex, colIndex) => {
    const actualRowIndex = startIndex + rowIndex + 1

    switch (e.key) {
      case 'Tab': {
        e.preventDefault()
        const direction = e.shiftKey ? -1 : 1
        let nextCol = colIndex + direction
        let nextRow = rowIndex

        if (nextCol >= headers.length) {
          nextCol = 0
          nextRow++
        } else if (nextCol < 0) {
          nextCol = headers.length - 1
          nextRow--
        }

        const nextInput = tableRef.current?.querySelector(
          `input[data-row="${nextRow}"][data-col="${nextCol}"]`
        )
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
        break
      }
      case 'Enter': {
        e.preventDefault()
        const nextInput = tableRef.current?.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`
        )
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
        break
      }
      case 'ArrowUp': {
        if (e.ctrlKey) {
          e.preventDefault()
          const prevInput = tableRef.current?.querySelector(
            `input[data-row="${rowIndex - 1}"][data-col="${colIndex}"]`
          )
          if (prevInput) {
            prevInput.focus()
            prevInput.select()
          }
        }
        break
      }
      case 'ArrowDown': {
        if (e.ctrlKey) {
          e.preventDefault()
          const nextInput = tableRef.current?.querySelector(
            `input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`
          )
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        }
        break
      }
    }
  }, [startIndex, headers.length])

  const handlePaste = useCallback((e, rowIndex, colIndex) => {
    const pastedData = e.clipboardData.getData('text')
    if (pastedData.includes('\n') || pastedData.includes('\t')) {
      e.preventDefault()
      const actualRowIndex = startIndex + rowIndex + 1
      onPaste?.(pastedData, actualRowIndex, colIndex)
    }
  }, [startIndex, onPaste])

  // Apply fixed layout when column widths are set
  useEffect(() => {
    if (tableRef.current && columnWidths.some(w => w)) {
      tableRef.current.style.tableLayout = 'fixed'
    }
  }, [columnWidths])

  return (
    <div className="table-wrapper">
      <table ref={tableRef} id="csvTable">
        <thead>
          <tr>
            <th className="row-number">#</th>
            {headers.map((header, index) => (
              <th
                key={index}
                style={columnWidths[index] ? { width: columnWidths[index] + 'px' } : undefined}
                title={header || `Column ${index + 1}`}
              >
                {header || `Column ${index + 1}`}
                <div
                  className="resize-handle"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    initResize(index, e.clientX)
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={startIndex + rowIndex + 1}>
              <td className="row-number">{startIndex + rowIndex + 1}</td>
              {headers.map((_, colIndex) => (
                <td key={colIndex}>
                  <input
                    className="cell-input"
                    type="text"
                    value={row[colIndex] || ''}
                    data-row={rowIndex}
                    data-col={colIndex}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
