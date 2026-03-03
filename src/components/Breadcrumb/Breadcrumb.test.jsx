import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Breadcrumb } from './Breadcrumb'

describe('Breadcrumb', () => {
  it('renders nothing for empty items', () => {
    const { container } = render(<Breadcrumb items={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for null items', () => {
    const { container } = render(<Breadcrumb items={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows all items for <=5 segments', () => {
    const items = [
      { name: 'Home' },
      { name: 'Users' },
      { name: 'Documents' },
    ]
    render(<Breadcrumb items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('last item gets current class', () => {
    const items = [{ name: 'Root' }, { name: 'Current' }]
    render(<Breadcrumb items={items} />)
    const lastItem = screen.getByText('Current')
    expect(lastItem).toHaveClass('current')
  })

  it('truncates with ellipsis for 6+ items', () => {
    const items = [
      { name: 'A' }, { name: 'B' }, { name: 'C' },
      { name: 'D' }, { name: 'E' }, { name: 'F' },
    ]
    render(<Breadcrumb items={items} />)
    // First 2 and last 2 should be visible
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
    // Middle items hidden behind ellipsis
    expect(screen.queryByText('C')).not.toBeInTheDocument()
    expect(screen.queryByText('D')).not.toBeInTheDocument()
    // Ellipsis is present
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('ellipsis click opens dropdown with hidden items', () => {
    const items = [
      { name: 'A' }, { name: 'B' }, { name: 'C' },
      { name: 'D' }, { name: 'E' }, { name: 'F' },
    ]
    render(<Breadcrumb items={items} />)
    fireEvent.click(screen.getByText('…'))
    // Hidden items C, D now visible in dropdown
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('Escape closes dropdown', () => {
    const items = [
      { name: 'A' }, { name: 'B' }, { name: 'C' },
      { name: 'D' }, { name: 'E' }, { name: 'F' },
    ]
    render(<Breadcrumb items={items} />)
    fireEvent.click(screen.getByText('…'))
    expect(screen.getByText('C')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })

  it('onNavigate called with correct index', () => {
    const onNavigate = vi.fn()
    const items = [{ name: 'Root' }, { name: 'Sub' }, { name: 'Current' }]
    render(<Breadcrumb items={items} onNavigate={onNavigate} />)

    // Click on non-last, non-url item triggers onNavigate
    fireEvent.click(screen.getByText('Sub'))
    expect(onNavigate).toHaveBeenCalledWith(1)
  })
})
