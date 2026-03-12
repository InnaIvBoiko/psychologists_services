import { useAuth } from '../context/AuthContext.jsx'
import { togglePsychologistFavorite } from '../strapi/strapi.js'

export function useFavorites() {
  const { user, token, favorites, setFavorites } = useAuth()

  const getFavorites = () => {
    if (!user) return []
    return favorites || []
  }

  const isFavorite = (psyObject) => {
    if (!user) return false
    const matchId = String(psyObject.strapiId || psyObject.id)
    return (favorites || []).includes(matchId)
  }

  const toggleFavorite = async (psyObject) => {
    if (!user) return
    
    // The backend expects the numeric id as a string
    const matchId = String(psyObject.strapiId || psyObject.id)

    // Optimistic UI update (React state)
    const current = favorites || []
    const updated = current.includes(matchId)
      ? current.filter((f) => f !== matchId)
      : [...current, matchId]
    
    setFavorites(updated)

    // Background backend update
    if (token) {
      // Pass the id that Strapi v5 expects to the custom endpoint
      await togglePsychologistFavorite(psyObject.id, token)
    }
  }

  return { getFavorites, isFavorite, toggleFavorite }
}
