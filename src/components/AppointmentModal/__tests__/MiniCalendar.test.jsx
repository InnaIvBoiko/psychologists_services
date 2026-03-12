import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MiniCalendar from '../MiniCalendar.jsx'

// Fix "today" to a known date so tests are deterministic
const FIXED_DATE = new Date('2025-06-15T00:00:00')
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
})
afterAll(() => vi.useRealTimers())

describe('MiniCalendar', () => {
  it('renders the current month and year label', () => {
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    expect(screen.getByText('June 2025')).toBeInTheDocument()
  })

  it('renders all 7 day-name headers', () => {
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    const headers = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    headers.forEach(d => expect(screen.getByText(d)).toBeInTheDocument())
  })

  it('disables past days', () => {
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    // Day 14 is yesterday (today is 15)
    const day14 = screen.getByRole('button', { name: '14' })
    expect(day14).toBeDisabled()
  })

  it('does not disable today or future days', () => {
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    const day15 = screen.getByRole('button', { name: '15' })
    expect(day15).not.toBeDisabled()
    const day20 = screen.getByRole('button', { name: '20' })
    expect(day20).not.toBeDisabled()
  })

  it('calls onChange with ISO date string when a day is clicked', () => {
    const onChange = vi.fn()
    render(<MiniCalendar selected={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '20' }))
    expect(onChange).toHaveBeenCalledWith('2025-06-20')
  })

  it('marks the selected day', () => {
    render(<MiniCalendar selected="2025-06-20" onChange={vi.fn()} />)
    const day20 = screen.getByRole('button', { name: '20' })
    expect(day20.className).toMatch(/selected/)
  })

  it('navigates to the next month', () => {
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    expect(screen.getByText('July 2025')).toBeInTheDocument()
  })

  it('navigates to the previous month', () => {
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    expect(screen.getByText('May 2025')).toBeInTheDocument()
  })

  it('wraps from January to December when navigating back', () => {
    // Start at January 2026
    vi.setSystemTime(new Date('2026-01-10T00:00:00'))
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '‹' }))
    expect(screen.getByText('December 2025')).toBeInTheDocument()
    vi.setSystemTime(FIXED_DATE)
  })

  it('wraps from December to January when navigating forward', () => {
    vi.setSystemTime(new Date('2025-12-01T00:00:00'))
    render(<MiniCalendar selected={null} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '›' }))
    expect(screen.getByText('January 2026')).toBeInTheDocument()
    vi.setSystemTime(FIXED_DATE)
  })
})
