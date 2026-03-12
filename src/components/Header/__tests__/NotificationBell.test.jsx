import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationBell from '../NotificationBell.jsx'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockGetUserAppointments = vi.fn()
const mockGetPastAppointmentsForReview = vi.fn()
const mockGetDismissedReviews = vi.fn()
const mockDismissAppointmentReview = vi.fn()
const mockCancelAppointment = vi.fn()

vi.mock('../../../strapi/strapi.js', () => ({
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
  getPastAppointmentsForReview: (...args) => mockGetPastAppointmentsForReview(...args),
  getDismissedReviews: (...args) => mockGetDismissedReviews(...args),
  dismissAppointmentReview: (...args) => mockDismissAppointmentReview(...args),
  cancelAppointment: (...args) => mockCancelAppointment(...args),
}))

vi.mock('../../ReviewModal/ReviewModal.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="review-modal">
      <button onClick={onClose}>close</button>
    </div>
  ),
}))

vi.mock('../../CancelModal/CancelModal.jsx', () => ({
  default: ({ onClose, onConfirm }) => (
    <div data-testid="cancel-modal">
      <button onClick={onConfirm}>confirm-cancel</button>
      <button onClick={onClose}>keep</button>
    </div>
  ),
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
// > 24h away — cancellable
const futureDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
})()

// < 24h away — NOT cancellable
const nearFutureSlot = (() => {
  const d = new Date()
  d.setHours(d.getHours() + 2)
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:00`
})()

const pastDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 5)
  return d.toISOString().slice(0, 10)
})()

const twoAppointments = [
  { id: 1, documentId: 'doc-1', time_slot: `${futureDate} 10:00`, psychologist_name: 'Dr. Smith' },
  { id: 2, documentId: 'doc-2', time_slot: `${futureDate} 14:00`, psychologist_name: 'Dr. Jones' },
]

const onePastAppointment = [
  { id: 10, time_slot: `${pastDate} 11:00`, psychologist_name: 'Dr. Lee', psychologist_id: '5', patient_name: 'Jane Doe' },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPastAppointmentsForReview.mockResolvedValue([])
    mockGetDismissedReviews.mockResolvedValue([])
    mockDismissAppointmentReview.mockResolvedValue()
    mockCancelAppointment.mockResolvedValue()
  })

  it('renders the bell button', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    render(<NotificationBell />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('shows no badge when there are no appointments or pending reviews', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    expect(screen.queryByText(/^\d/)).toBeNull()
  })

  it('shows badge with upcoming appointment count', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
  })

  it('badge includes pending reviews in total count', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    mockGetPastAppointmentsForReview.mockResolvedValue(onePastAppointment)
    render(<NotificationBell />)
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
  })

  it('shows 9+ badge when total count exceeds 9', async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      documentId: `doc-${i}`,
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

  it('shows Cancel button for appointments more than 24h away', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    const cancelBtns = screen.getAllByRole('button', { name: /cancel appointment/i })
    expect(cancelBtns).toHaveLength(2)
  })

  it('does NOT show Cancel button for appointments within 24h', async () => {
    const nearAppt = [{ id: 3, documentId: 'doc-3', time_slot: nearFutureSlot, psychologist_name: 'Dr. Near' }]
    mockGetUserAppointments.mockResolvedValue(nearAppt)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.queryByRole('button', { name: /cancel appointment/i })).toBeNull()
  })

  it('Cancel button opens CancelModal', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /cancel appointment/i })[0])
    expect(screen.getByTestId('cancel-modal')).toBeInTheDocument()
  })

  it('confirming cancel removes appointment and calls cancelAppointment', async () => {
    mockGetUserAppointments.mockResolvedValue(twoAppointments)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetUserAppointments).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /cancel appointment/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /confirm-cancel/i }))
    await waitFor(() => expect(mockCancelAppointment).toHaveBeenCalledWith('doc-1', 'jwt-token'))
    expect(screen.queryByText('Dr. Smith')).toBeNull()
  })

  it('shows "Rate your sessions" section when there are pending reviews', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    mockGetPastAppointmentsForReview.mockResolvedValue(onePastAppointment)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetPastAppointmentsForReview).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('Rate your sessions')).toBeInTheDocument()
    expect(screen.getByText('Dr. Lee')).toBeInTheDocument()
  })

  it('dismiss button removes review from list', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    mockGetPastAppointmentsForReview.mockResolvedValue(onePastAppointment)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetPastAppointmentsForReview).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('Dr. Lee')).toBeNull()
  })

  it('review button opens ReviewModal', async () => {
    mockGetUserAppointments.mockResolvedValue([])
    mockGetPastAppointmentsForReview.mockResolvedValue(onePastAppointment)
    render(<NotificationBell />)
    await waitFor(() => expect(mockGetPastAppointmentsForReview).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))
    fireEvent.click(screen.getByRole('button', { name: /★ review/i }))
    expect(screen.getByTestId('review-modal')).toBeInTheDocument()
  })

  it('shows empty state message when no upcoming appointments', async () => {
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
