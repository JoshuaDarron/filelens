export function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onRowsPerPageChange,
  pageNumbers,
  isFirstPage,
  isLastPage,
  rowsPerPageOptions = [25, 50, 100, 500]
}) {
  return (
    <div className="table-controls">
      <div className="rows-per-page">
        <span>Rows per page:</span>
        <select
          className="rows-select"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
        >
          {rowsPerPageOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="pagination-controls">
        <div className="pagination-info">
          Showing {startIndex + 1}-{endIndex} of {totalItems} rows
        </div>
        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            title="First page"
          >
            <i className="bi bi-chevron-double-left"></i>
          </button>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirstPage}
            title="Previous page"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="pagination-buttons">
            {pageNumbers.map((page, idx) => (
              page.type === 'ellipsis' ? (
                <span
                  key={`ellipsis-${page.value}`}
                  className="pagination-btn"
                  style={{ cursor: 'default', border: 'none', background: 'transparent' }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={page.value}
                  className={`pagination-btn ${page.value === currentPage ? 'active' : ''}`}
                  onClick={() => onPageChange(page.value)}
                >
                  {page.value}
                </button>
              )
            ))}
          </span>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLastPage}
            title="Next page"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            title="Last page"
          >
            <i className="bi bi-chevron-double-right"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
