'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import FavoritesPage from '@/views/FavoritesPage/FavoritesPage.jsx'

// Protected route: redirect to home if not logged in (replaces react-router <ProtectedRoute>).
export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  if (!user) return null
  return <FavoritesPage />
}
