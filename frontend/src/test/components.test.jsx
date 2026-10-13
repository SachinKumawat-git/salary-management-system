import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StatusBadge, CurrencyBadge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { Pagination } from '../components/ui/Pagination'
import { Users } from 'lucide-react'

describe('UI Components', () => {
  it('renders StatusBadge correctly for various statuses', () => {
    const { rerender } = render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()

    rerender(<StatusBadge status="inactive" />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()

    rerender(<StatusBadge status="terminated" />)
    expect(screen.getByText('Terminated')).toBeInTheDocument()
  })

  it('renders CurrencyBadge with currency code', () => {
    render(<CurrencyBadge currency="USD" />)
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="Total Headcount"
        value="10,000"
        subtitle="Active staff"
        icon={Users}
        color="indigo"
      />
    )
    expect(screen.getByText('Total Headcount')).toBeInTheDocument()
    expect(screen.getByText('10,000')).toBeInTheDocument()
    expect(screen.getByText('Active staff')).toBeInTheDocument()
  })

  it('renders Pagination and responds to page change', () => {
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()

    render(
      <Pagination
        page={1}
        pageSize={25}
        totalCount={100}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    )

    expect(screen.getByText(/Showing/i)).toBeInTheDocument()
    expect(screen.getAllByText('100').length).toBeGreaterThan(0)

    // Next page button
    const nextBtn = screen.getByLabelText('Next Page')
    expect(nextBtn).toBeEnabled()
    fireEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(2)

    // Previous page button is disabled on page 1
    const prevBtn = screen.getByLabelText('Previous Page')
    expect(prevBtn).toBeDisabled()
  })
})
