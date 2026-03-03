import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from './Toast'

function makeToast(overrides = {}) {
  return {
    id: 1,
    type: 'info',
    message: 'Test message',
    title: null,
    closable: true,
    isHiding: false,
    showProgress: false,
    duration: 3000,
    ...overrides,
  }
}

describe('Toast', () => {
  it('renders message and title', () => {
    render(<Toast toast={makeToast({ title: 'Heads up', message: 'Something happened' })} onClose={() => {}} />)
    expect(screen.getByText('Heads up')).toBeInTheDocument()
    expect(screen.getByText('Something happened')).toBeInTheDocument()
  })

  it('renders correct icon for success type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'success' })} onClose={() => {}} />)
    expect(container.querySelector('.bi-check-circle-fill')).toBeInTheDocument()
  })

  it('renders correct icon for error type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'error' })} onClose={() => {}} />)
    expect(container.querySelector('.bi-exclamation-triangle-fill')).toBeInTheDocument()
  })

  it('renders spinner for loading type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'loading' })} onClose={() => {}} />)
    expect(container.querySelector('.toast-spinner')).toBeInTheDocument()
  })

  it('renders info icon for default/info type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'info' })} onClose={() => {}} />)
    expect(container.querySelector('.bi-info-circle-fill')).toBeInTheDocument()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(<Toast toast={makeToast({ id: 42 })} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledWith(42)
  })

  it('no close button when closable=false', () => {
    render(<Toast toast={makeToast({ closable: false })} onClose={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('hide class applied when isHiding=true', () => {
    const { container } = render(<Toast toast={makeToast({ isHiding: true })} onClose={() => {}} />)
    expect(container.querySelector('.toast')).toHaveClass('hide')
  })

  it('show class applied when not hiding', () => {
    const { container } = render(<Toast toast={makeToast({ isHiding: false })} onClose={() => {}} />)
    expect(container.querySelector('.toast')).toHaveClass('show')
  })
})
