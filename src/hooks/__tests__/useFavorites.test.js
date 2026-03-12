import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../useFavorites.js'

// ---------------------------------------------------------------------------
// Mock AuthContext and Strapi toggle call
// ---------------------------------------------------------------------------
const mockSetFavorites = vi.fn()
const mockAuth = {
  user: { id: 1, email: 'user@test.com' },
  token: 'jwt-token',
  favorites: ['42', '17'],
  setFavorites: mockSetFavorites,
}

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('../../strapi/strapi.js', () => ({
  togglePsychologistFavorite: vi.fn().mockResolvedValue({ isFavorite: true }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useFavorites', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getFavorites', () => {
    it('returns the favorites array from context', () => {
      const { result } = renderHook(() => useFavorites())
      expect(result.current.getFavorites()).toEqual(['42', '17'])
    })

    it('returns empty array when no user', () => {
      mockAuth.user = null
      const { result } = renderHook(() => useFavorites())
      expect(result.current.getFavorites()).toEqual([])
      mockAuth.user = { id: 1 }
    })
  })

  describe('isFavorite', () => {
    it('returns true when psychologist strapiId is in favorites', () => {
      mockAuth.user = { id: 1 }
      mockAuth.favorites = ['42', '17']
      const { result } = renderHook(() => useFavorites())
      expect(result.current.isFavorite({ strapiId: '42', id: 'doc-1' })).toBe(true)
    })

    it('returns false when not in favorites', () => {
      const { result } = renderHook(() => useFavorites())
      expect(result.current.isFavorite({ strapiId: '99', id: 'doc-9' })).toBe(false)
    })

    it('returns false when no user is logged in', () => {
      mockAuth.user = null
      const { result } = renderHook(() => useFavorites())
      expect(result.current.isFavorite({ strapiId: '42' })).toBe(false)
      mockAuth.user = { id: 1 }
    })

    it('falls back to id when strapiId is not present', () => {
      mockAuth.favorites = ['42']
      const { result } = renderHook(() => useFavorites())
      expect(result.current.isFavorite({ id: '42' })).toBe(true)
    })
  })

  describe('toggleFavorite', () => {
    it('adds a psychologist to favorites optimistically', async () => {
      mockAuth.favorites = ['42']
      mockAuth.user = { id: 1 }
      const { result } = renderHook(() => useFavorites())
      await act(async () => {
        await result.current.toggleFavorite({ strapiId: '99', id: 'doc-9' })
      })
      expect(mockSetFavorites).toHaveBeenCalledWith(['42', '99'])
    })

    it('removes a psychologist from favorites optimistically', async () => {
      mockAuth.favorites = ['42', '17']
      const { result } = renderHook(() => useFavorites())
      await act(async () => {
        await result.current.toggleFavorite({ strapiId: '42', id: 'doc-1' })
      })
      expect(mockSetFavorites).toHaveBeenCalledWith(['17'])
    })

    it('does nothing when no user is logged in', async () => {
      mockAuth.user = null
      const { result } = renderHook(() => useFavorites())
      await act(async () => {
        await result.current.toggleFavorite({ strapiId: '42' })
      })
      expect(mockSetFavorites).not.toHaveBeenCalled()
      mockAuth.user = { id: 1 }
    })
  })
})
