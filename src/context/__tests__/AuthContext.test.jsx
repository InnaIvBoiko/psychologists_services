import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mock Auth.js (next-auth) and the data layer
// ---------------------------------------------------------------------------
const mockSignIn = vi.fn()
const mockSignOut = vi.fn()
let sessionValue = { data: null, status: 'unauthenticated' }

vi.mock('next-auth/react', () => ({
  useSession: () => sessionValue,
  signIn: (...args) => mockSignIn(...args),
  signOut: (...args) => mockSignOut(...args),
  SessionProvider: ({ children }) => children,
}))

vi.mock('@/lib/api', () => ({
  getUserFavorites: vi.fn().mockResolvedValue([]),
  deleteAccount: vi.fn().mockResolvedValue({}),
}))

import { AuthProvider, useAuth } from '../AuthContext.jsx'
import { getUserFavorites } from '@/lib/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function AuthConsumer() {
  const { user, token, favorites } = useAuth()
  return (
    <div>
      <p data-testid="user">{user ? user.displayName : 'null'}</p>
      <p data-testid="token">{token ?? 'null'}</p>
      <p data-testid="favorites">{JSON.stringify(favorites)}</p>
    </div>
  )
}

function captureCtx() {
  let ctx
  function Capture() {
    ctx = useAuth()
    return null
  }
  render(
    <AuthProvider>
      <Capture />
    </AuthProvider>
  )
  return () => ctx
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AuthContext (Auth.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionValue = { data: null, status: 'unauthenticated' }
    getUserFavorites.mockResolvedValue([])
  })

  it('starts with no user, null token, empty favorites', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'))
    expect(screen.getByTestId('token').textContent).toBe('null')
    expect(screen.getByTestId('favorites').textContent).toBe('[]')
  })

  it('exposes the session user and loads favorites when authenticated', async () => {
    sessionValue = {
      data: { user: { email: 'jane@test.com', username: 'Jane' } },
      status: 'authenticated',
    }
    getUserFavorites.mockResolvedValueOnce(['10', '20'])

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Jane'))
    await waitFor(() =>
      expect(screen.getByTestId('favorites').textContent).toBe('["10","20"]')
    )
    expect(screen.getByTestId('token').textContent).toBe('null')
  })

  it('login calls signIn with credentials', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null, ok: true })
    const getCtx = captureCtx()

    await act(async () => {
      await getCtx().login('user@test.com', 'password')
    })

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'user@test.com',
      password: 'password',
      redirect: false,
    })
  })

  it('login throws on invalid credentials', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'CredentialsSignin' })
    const getCtx = captureCtx()

    await expect(getCtx().login('bad@test.com', 'wrong')).rejects.toThrow(
      'Invalid email or password'
    )
  })

  it('register posts to /api/register then signs in', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ user: { id: 2 } }) })
    vi.stubGlobal('fetch', fetchMock)
    mockSignIn.mockResolvedValueOnce({ error: null, ok: true })

    const getCtx = captureCtx()
    await act(async () => {
      await getCtx().register('Jane', 'jane@test.com', 'pass123')
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/register', expect.objectContaining({ method: 'POST' }))
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'jane@test.com',
      password: 'pass123',
      redirect: false,
    })
    vi.unstubAllGlobals()
  })

  it('logout calls signOut', async () => {
    const getCtx = captureCtx()
    await act(async () => {
      getCtx().logout()
    })
    expect(mockSignOut).toHaveBeenCalled()
  })
})
