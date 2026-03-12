import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext.jsx'

// ---------------------------------------------------------------------------
// Mock axios and strapi helpers
// ---------------------------------------------------------------------------
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('../../strapi/strapi.js', () => ({
  getUserFavorites: vi.fn().mockResolvedValue(['1', '2']),
}))

import axios from 'axios'
import { getUserFavorites } from '../../strapi/strapi.js'

// ---------------------------------------------------------------------------
// Helper: component that reads auth context and renders state
// ---------------------------------------------------------------------------
function AuthConsumer() {
  const { user, token, favorites, loading } = useAuth()
  if (loading) return <p>Loading…</p>
  return (
    <div>
      <p data-testid="user">{user ? user.displayName : 'null'}</p>
      <p data-testid="token">{token ?? 'null'}</p>
      <p data-testid="favorites">{JSON.stringify(favorites)}</p>
    </div>
  )
}

function LoginButton() {
  const { login } = useAuth()
  return (
    <button onClick={() => login('user@test.com', 'password')}>Log in</button>
  )
}

function RegisterButton() {
  const { register } = useAuth()
  return (
    <button onClick={() => register('Jane', 'jane@test.com', 'pass123')}>Register</button>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  return <button onClick={logout}>Log out</button>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AuthContext', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with no user, no token, empty favorites', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'))
    expect(screen.getByTestId('token').textContent).toBe('null')
    expect(screen.getByTestId('favorites').textContent).toBe('[]')
  })

  it('sets user and token after successful login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        jwt: 'my-jwt',
        user: { id: 1, username: 'Jane', email: 'jane@test.com' },
      },
    })

    render(
      <AuthProvider>
        <AuthConsumer />
        <LoginButton />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Log in' }).click()
    })

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Jane'))
    expect(screen.getByTestId('token').textContent).toBe('my-jwt')
  })

  it('fetches favorites after login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        jwt: 'my-jwt',
        user: { id: 1, username: 'Jane' },
      },
    })
    getUserFavorites.mockResolvedValueOnce(['10', '20'])

    render(
      <AuthProvider>
        <AuthConsumer />
        <LoginButton />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Log in' }).click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('favorites').textContent).toBe('["10","20"]')
    )
  })

  it('throws on login failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid credentials' } } },
    })

    const { login } = (() => {
      let ctx
      function Capture() { ctx = useAuth(); return null }
      render(<AuthProvider><Capture /></AuthProvider>)
      return ctx
    })()

    await expect(login('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('sets user and token after successful register', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        jwt: 'reg-jwt',
        user: { id: 2, username: 'NewUser' },
      },
    })

    render(
      <AuthProvider>
        <AuthConsumer />
        <RegisterButton />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Register' }).click()
    })

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('NewUser'))
    expect(screen.getByTestId('token').textContent).toBe('reg-jwt')
  })

  it('clears user and token after logout', async () => {
    axios.post.mockResolvedValueOnce({
      data: { jwt: 'my-jwt', user: { id: 1, username: 'Jane' } },
    })

    render(
      <AuthProvider>
        <AuthConsumer />
        <LoginButton />
        <LogoutButton />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Log in' }).click()
    })
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Jane'))

    await act(async () => {
      screen.getByRole('button', { name: 'Log out' }).click()
    })
    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(screen.getByTestId('token').textContent).toBe('null')
    expect(screen.getByTestId('favorites').textContent).toBe('[]')
  })
})
