import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios so no real HTTP calls are made
vi.mock('axios', () => {
  const instance = { get: vi.fn(), post: vi.fn() }
  return {
    default: {
      create: vi.fn(() => instance),
    },
    __instance: instance,
  }
})

// Import after mock is set up
const { default: axiosDefault } = await import('axios')
const strapiApi = axiosDefault.create()

// Re-import the module under test so it uses the mocked axios instance
const {
  getPsychologists,
  getPsychologistById,
  getUserFavorites,
  getBookedSlots,
  getUserAppointments,
  createAppointment,
} = await import('../strapi.js')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeItem = (overrides = {}) => ({
  id: 1,
  documentId: 'doc-abc',
  name: 'John',
  surname: 'Smith',
  specialization: 'Anxiety',
  ...overrides,
})

// ---------------------------------------------------------------------------
// getPsychologists
// ---------------------------------------------------------------------------
describe('getPsychologists', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps Strapi v5 response to flat objects with strapiId and documentId', async () => {
    strapiApi.get.mockResolvedValueOnce({
      data: { data: [makeItem()] },
    })
    const result = await getPsychologists()
    expect(result).toHaveLength(1)
    // ...item spread overwrites the initial id: item.documentId, so id stays numeric
    expect(result[0].documentId).toBe('doc-abc')
    expect(result[0].strapiId).toBe('1')
    expect(result[0].name).toBe('John')
  })

  it('returns empty array on network error', async () => {
    strapiApi.get.mockRejectedValueOnce(new Error('Network error'))
    const result = await getPsychologists()
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getPsychologistById
// ---------------------------------------------------------------------------
describe('getPsychologistById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a single psychologist with strapiId and documentId', async () => {
    strapiApi.get.mockResolvedValueOnce({ data: { data: makeItem() } })
    const result = await getPsychologistById('doc-abc')
    expect(result.documentId).toBe('doc-abc')
    expect(result.strapiId).toBe('1')
  })

  it('returns null on error', async () => {
    strapiApi.get.mockRejectedValueOnce(new Error('404'))
    const result = await getPsychologistById('missing')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getUserFavorites
// ---------------------------------------------------------------------------
describe('getUserFavorites', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns psy_favorites array', async () => {
    strapiApi.get.mockResolvedValueOnce({
      data: { psy_favorites: ['1', '2', '3'] },
    })
    const result = await getUserFavorites('jwt-token')
    expect(result).toEqual(['1', '2', '3'])
  })

  it('returns empty array when psy_favorites is missing', async () => {
    strapiApi.get.mockResolvedValueOnce({ data: {} })
    const result = await getUserFavorites('jwt-token')
    expect(result).toEqual([])
  })

  it('parses psy_favorites when returned as JSON string', async () => {
    strapiApi.get.mockResolvedValueOnce({
      data: { psy_favorites: '["10","20"]' },
    })
    const result = await getUserFavorites('jwt-token')
    expect(result).toEqual(['10', '20'])
  })

  it('returns empty array when no jwt is provided', async () => {
    const result = await getUserFavorites(null)
    expect(result).toEqual([])
    expect(strapiApi.get).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// getBookedSlots
// ---------------------------------------------------------------------------
describe('getBookedSlots', () => {
  beforeEach(() => vi.clearAllMocks())

  it('extracts HH:MM from time_slot strings', async () => {
    strapiApi.get.mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, time_slot: '2025-06-15 10:00' },
          { id: 2, time_slot: '2025-06-15 14:00' },
        ],
      },
    })
    const result = await getBookedSlots('doc-abc', '2025-06-15', 'jwt')
    expect(result).toEqual(['10:00', '14:00'])
  })

  it('returns empty array when date is not provided', async () => {
    const result = await getBookedSlots('doc-abc', null, 'jwt')
    expect(result).toEqual([])
    expect(strapiApi.get).not.toHaveBeenCalled()
  })

  it('filters out entries with no time part', async () => {
    strapiApi.get.mockResolvedValueOnce({
      data: { data: [{ id: 1, time_slot: '' }, { id: 2, time_slot: '2025-06-15 09:00' }] },
    })
    const result = await getBookedSlots('doc-abc', '2025-06-15', 'jwt')
    expect(result).toEqual(['09:00'])
  })

  it('returns empty array on error', async () => {
    strapiApi.get.mockRejectedValueOnce(new Error('500'))
    const result = await getBookedSlots('doc-abc', '2025-06-15', 'jwt')
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getUserAppointments
// ---------------------------------------------------------------------------
describe('getUserAppointments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only future appointments sorted by time_slot', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().slice(0, 10)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const pastDate = yesterday.toISOString().slice(0, 10)

    strapiApi.get.mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, time_slot: `${futureDate} 10:00`, psychologist_name: 'Dr. A' },
          { id: 2, time_slot: `${pastDate} 09:00`, psychologist_name: 'Dr. B' },
        ],
      },
    })
    const result = await getUserAppointments('user@test.com', 'jwt')
    expect(result).toHaveLength(1)
    expect(result[0].psychologist_name).toBe('Dr. A')
  })

  it('returns empty array when email or token missing', async () => {
    expect(await getUserAppointments('', 'jwt')).toEqual([])
    expect(await getUserAppointments('email@test.com', '')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// createAppointment
// ---------------------------------------------------------------------------
describe('createAppointment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('wraps data in a data object and posts to /appointments', async () => {
    strapiApi.post.mockResolvedValueOnce({ data: { id: 99 } })
    const payload = { patient_name: 'Jane', email: 'jane@test.com', time_slot: '2025-06-15 10:00' }
    const result = await createAppointment(payload, 'jwt')
    expect(strapiApi.post).toHaveBeenCalledWith(
      '/appointments',
      { data: payload },
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    )
    expect(result).toEqual({ id: 99 })
  })

  it('throws a readable error on failure', async () => {
    strapiApi.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Validation failed' } } },
    })
    await expect(createAppointment({}, 'jwt')).rejects.toThrow('Validation failed')
  })
})
