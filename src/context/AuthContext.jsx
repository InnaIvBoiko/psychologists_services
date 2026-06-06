'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { getUserFavorites, deleteAccount as apiDeleteAccount } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const [favorites, setFavorites] = useState([])

  // Normalize the Auth.js session user to the shape the rest of the app expects.
  const user = session?.user
    ? {
        ...session.user,
        displayName: session.user.username || session.user.name || session.user.email,
      }
    : null

  // Sync favorites whenever the logged-in identity changes.
  const userEmail = user?.email
  useEffect(() => {
    let active = true
    if (userEmail) {
      getUserFavorites().then((favs) => {
        if (active) setFavorites(favs)
      })
    } else {
      setFavorites([])
    }
    return () => {
      active = false
    }
  }, [userEmail])

  const register = async (name, email, password) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, email, password }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Registration failed')
    }
    // Auto-login right after a successful registration.
    const signInRes = await signIn('credentials', { email, password, redirect: false })
    if (signInRes?.error) {
      throw new Error('Login after registration failed')
    }
    return data
  }

  const login = async (email, password) => {
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) {
      throw new Error('Invalid email or password')
    }
    return res
  }

  const logout = () => {
    setFavorites([])
    signOut({ redirect: false })
  }

  const deleteAccount = async () => {
    await apiDeleteAccount()
    setFavorites([])
    await signOut({ redirect: false })
  }

  // `token` is kept for backward compatibility with call sites; auth is now cookie-based.
  return (
    <AuthContext.Provider
      value={{ user, token: null, loading, favorites, setFavorites, register, login, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
