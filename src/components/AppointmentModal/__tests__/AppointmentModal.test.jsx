import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AppointmentModal from '../AppointmentModal.jsx'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockGetBookedSlots = vi.fn()
const mockCreateAppointment = vi.fn()

vi.mock('../../../strapi/strapi.js', () => ({
  getBookedSlots: (...args) => mockGetBookedSlots(...args),
  createAppointment: (...args) => mockCreateAppointment(...args),
}))

vi.mock('../../../utils/availability.js', () => ({
  isWorkingDay: () => true,
  generateSlots: () => ['09:00', '10:00', '11:00'],
}))

// Stub MiniCalendar so date selection is controllable in tests
vi.mock('../MiniCalendar.jsx', () => ({
  default: ({ onChange }) => (
    <button data-testid="mini-calendar" onClick={() => onChange('2025-06-16')}>
      Pick date
    </button>
  ),
}))

vi.mock('../../AuthModal/AuthModal.jsx', () => ({
  default: ({ mode, onClose }) => (
    <div data-testid="auth-modal" data-mode={mode}>
      <button onClick={onClose}>close-auth</button>
    </div>
  ),
}))

const mockAuth = {
  user: { id: 1, email: 'user@test.com', displayName: 'Jane Doe' },
  token: 'jwt-token',
}

vi.mock('../../../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const psychologist = {
  id: 2,
  documentId: 'doc-uuid-abc123',
  name: 'Dr. Smith',
  availability: null,
  avatar: '👨‍⚕️',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AppointmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBookedSlots.mockResolvedValue([])
    mockCreateAppointment.mockResolvedValue({})
    mockAuth.user = { id: 1, email: 'user@test.com', displayName: 'Jane Doe' }
    mockAuth.token = 'jwt-token'
  })

  // ── Auth notice banner ──────────────────────────────────────────────────

  it('shows auth notice when user is not logged in', () => {
    mockAuth.user = null
    mockAuth.token = null
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    expect(screen.getByText(/log in or register/i)).toBeInTheDocument()
  })

  it('does not show auth notice when user is logged in', () => {
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    expect(screen.queryByText(/log in or register/i)).toBeNull()
  })

  it('opens AuthModal in login mode when Log In is clicked', () => {
    mockAuth.user = null
    mockAuth.token = null
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }))
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-mode', 'login')
  })

  it('opens AuthModal in register mode when Register is clicked', () => {
    mockAuth.user = null
    mockAuth.token = null
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }))
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-mode', 'register')
  })

  it('closes AuthModal when onClose is called', () => {
    mockAuth.user = null
    mockAuth.token = null
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close-auth/i }))
    expect(screen.queryByTestId('auth-modal')).toBeNull()
  })

  // ── Submit button label ─────────────────────────────────────────────────

  it('shows "Send as a guest" when not logged in', () => {
    mockAuth.user = null
    mockAuth.token = null
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /send as a guest/i })).toBeInTheDocument()
  })

  it('shows "Send" when logged in', () => {
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^send$/i })).toBeInTheDocument()
  })

  // ── getBookedSlots uses documentId ──────────────────────────────────────

  it('calls getBookedSlots with psychologist.documentId when date is selected', async () => {
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('mini-calendar'))
    await waitFor(() => expect(mockGetBookedSlots).toHaveBeenCalled())
    expect(mockGetBookedSlots.mock.calls[0][0]).toBe(psychologist.documentId)
  })

  // ── createAppointment uses documentId ───────────────────────────────────

  it('calls createAppointment with psychologist.documentId as psychologist_id', async () => {
    render(<AppointmentModal psychologist={psychologist} onClose={vi.fn()} />)

    // Select date (via MiniCalendar stub)
    fireEvent.click(screen.getByTestId('mini-calendar'))
    await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument())

    // Select time slot
    fireEvent.click(screen.getByText('09:00'))

    // Fill required fields
    const [nameInput, phoneInput] = screen.getAllByRole('textbox').slice(0, 2)
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.change(phoneInput, { target: { value: '+39 333 1234567' } })
    const emailInput = screen.getByPlaceholderText('Email')
    fireEvent.change(emailInput, { target: { value: 'jane@test.com' } })

    fireEvent.click(screen.getByRole('button', { name: /^send$/i }))

    await waitFor(() => expect(mockCreateAppointment).toHaveBeenCalled())
    const payload = mockCreateAppointment.mock.calls[0][0]
    expect(payload.psychologist_id).toBe(psychologist.documentId)
  })
})
