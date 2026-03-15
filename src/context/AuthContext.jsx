import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { getUserFavorites, deleteAccount as strapiDeleteAccount } from '../strapi/strapi.js'

// The Strapi backend URL
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])

  // Since the user wants to strictly use memory (no localStorage),
  // on page reload the user will always be logged out.
  // Make sure to clean up any old data left in the browser.
  useEffect(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('jwt')
    localStorage.removeItem('psy_favorites')
    setLoading(false)
  }, [])

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${STRAPI_URL}/api/auth/local/register`, {
        username: name,
        email: email,
        password: password,
      })

      const { jwt, user: strapiUser } = response.data

      // Map the Strapi user to be compatible with the rest of the app
      const normalizedUser = { ...strapiUser, displayName: strapiUser.username }

      setToken(jwt)
      setUser(normalizedUser)

      return response.data
    } catch (error) {
      console.error("Strapi registration error:", error.response?.data?.error || error.message)
      throw new Error(error.response?.data?.error?.message || "Registration failed")
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${STRAPI_URL}/api/auth/local`, {
        identifier: email,
        password: password,
      })

      const { jwt, user: strapiUser } = response.data

      // Map the Strapi user to be compatible with the rest of the app
      const normalizedUser = { ...strapiUser, displayName: strapiUser.username }

      setToken(jwt)
      setUser(normalizedUser)

      // Sync favorites
      try {
        const favIds = await getUserFavorites(jwt)
        setFavorites(favIds)
      } catch (e) { console.error(e) }

      return response.data
    } catch (error) {
      console.error("Strapi login error:", error.response?.data?.error || error.message)
      throw new Error(error.response?.data?.error?.message || "Login failed")
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setFavorites([])
  }

  const deleteAccount = async () => {
    await strapiDeleteAccount(token)
    setToken(null)
    setUser(null)
    setFavorites([])
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, favorites, setFavorites, register, login, logout, deleteAccount }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
