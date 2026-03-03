import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

const defaultProps = {
  currentPage: 2,
  totalPages: 5,
  rowsPerPage: 25,
  totalItems: 120,
  startIndex: 25,
  endIndex: 50,
  onPageChange: vi.fn(),
  onRowsPerPageChange: vi.fn(),
  pageNumbers: [
    { type: 'page', value: 1 },
    { type: 'page', value: 2 },
    { type: 'page', value: 3 },
    { type: 'page', value: 4 },
    { type: 'page', value: 5 },
  ],
  isFirstPage: false,
  isLastPage: false,
}

describe('Pagination', () => {
  it('renders row range text', () => {
    render(<Pagination {...defaultProps} />)
    expect(screen.getByText('Showing 26-50 of 120 rows')).toBeInTheDocument()
  })

  it('First/Previous disabled on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} isFirstPage={true} />)
    const buttons = screen.getAllByRole('button')
    // First and Previous buttons (first two icon buttons)
    const firstBtn = buttons.find(b => b.title === 'First page')
    const prevBtn = buttons.find(b => b.title === 'Previous page')
    expect(firstBtn).toBeDisabled()
    expect(prevBtn).toBeDisabled()
  })

  it('Next/Last disabled on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} isLastPage={true} />)
    const buttons = screen.getAllByRole('button')
    const nextBtn = buttons.find(b => b.title === 'Next page')
    const lastBtn = buttons.find(b => b.title === 'Last page')
    expect(nextBtn).toBeDisabled()
    expect(lastBtn).toBeDisabled()
  })

  it('page number click calls handler', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('3'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('rows-per-page change calls handler', () => {
    const onRowsPerPageChange = vi.fn()
    render(<Pagination {...defaultProps} onRowsPerPageChange={onRowsPerPageChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '100' } })
    expect(onRowsPerPageChange).toHaveBeenCalledWith(100)
  })
})
