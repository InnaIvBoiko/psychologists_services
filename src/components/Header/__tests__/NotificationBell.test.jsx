import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationBell from '../NotificationBell.jsx'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockGetUserAppointments = vi.fn()

vi.mock('../../../strapi/strapi.js', () => ({
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
}))

const mockAuth = {
  user: { id: 1, email: 'user@test.com' },
  token: 'jwt-token',
}

vi.mock('../../../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const futureDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
})()

const twoAppointments = [
  { id: 1, time_slot: `${futureDate} 10:00`, psychologist_name: 'Dr. Smith' },
  { id: 2, time_slot: `${futureDate} 14:00`, psychologist_name: 'Dr. Jones' },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NotificationBell', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the bell button', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    render(<NotificationBell />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('shows no badge when there are no appointments', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    expect(screen.queryByText(/^\d/)).toBeNull()
  })

  it('shows badge with appointment count', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
  })

  it('shows 9+ badge when more than 9 appointments', async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      time_slot: `${futureDate} 09:00`,
      psychologist_name: 'Dr. X',
    }))
    mockGetUserAppointments.mockResolvedValue(many)
    render(<NotificationBell />)
    await waitFor(() => expect(screen.getByText('9+')).toBeInTheDocument())
  })

  it('opens dropdown when bell is clicked', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('Upcoming appointments')).toBeInTheDocument()
  })

  it('shows appointment doctor names in dropdown', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    expect(screen.getByText('Dr. Jones')).toBeInTheDocument()
  })

  it('shows empty state message when no appointments', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument()
  })

  it('toggles dropdown closed on second click', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    render(<NotificationBell />)
    const bell = screen.getByRole('button', { name: /notifications/i })
    fireEvent.click(bell)
    expect(screen.getByText('Upcoming appointments')).toBeInTheDocument()
    fireEvent.click(bell)
    expect(screen.queryByText('Upcoming appointments')).toBeNull()
  })

  it('returns null when no user is logged in', () => {
    mockAuth.user = null
    const { container } = render(<NotificationBell />)
    expect(container.firstChild).toBeNull()
    mockAuth.user = { id: 1, email: 'user@test.com' }
  })
})
