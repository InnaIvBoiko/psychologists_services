import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import PsychologistCard from '../../components/PsychologistCard/PsychologistCard.jsx'
import { PsychologistCardSkeletonList } from '../../components/PsychologistCard/PsychologistCardSkeleton.jsx'
import { useFavorites } from '../../hooks/useFavorites.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { getPsychologists } from '@/lib/api'
import styles from './FavoritesPage.module.css'

export default function FavoritesPage() {
  const t = useTranslations('Favorites')
  const { user } = useAuth()
  const { getFavorites } = useFavorites()
  const [toast, setToast] = useState(null)

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all psychologists once
  useEffect(() => {
    async function fetchData() {
      const psychologists = await getPsychologists()
      setData(psychologists)
      setLoading(false)
    }
    fetchData()
    window.addEventListener('psy:review-submitted', fetchData)
    return () => window.removeEventListener('psy:review-submitted', fetchData)
  }, [])

  // Automatically recalculate favorites when getFavorites() changes (which depends on the reactive context)
  const favIds = getFavorites()
  const favorites = data.filter((p) => {
    const matchId = String(p.strapiId || p.id)
    return favIds.includes(matchId)
  })

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.pageTitle}>{t('title')}</h1>

        {loading ? (
          <PsychologistCardSkeletonList count={2} />
        ) : favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">💙</div>
            <h2>{t('emptyTitle')}</h2>
            <p>{t('emptyDesc')}</p>
            <Link to="/psychologists" className="btn btn-center">
              {t('browse')}
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {favorites.map((p) => (
              <PsychologistCard key={p.id} psychologist={p} onToast={showToast} />
            ))}
          </div>
        )}
      </div>

      <div className={`toast ${toast ? 'visible' : ''}`}>{toast}</div>
    </div>
  )
}
