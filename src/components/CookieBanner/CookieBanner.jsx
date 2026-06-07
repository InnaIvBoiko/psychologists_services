import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import styles from './CookieBanner.module.css'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const t = useTranslations('CookieBanner')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="region" aria-label={t('regionLabel')}>
      <div className={styles.inner}>
        <p className={styles.text}>
          {t.rich('text', {
            privacy: (chunks) => (
              <Link to="/privacy" className={styles.link}>{chunks}</Link>
            ),
          })}
        </p>
        <div className={styles.actions}>
          <button className={styles.decline} onClick={decline}>
            {t('decline')}
          </button>
          <button className={styles.accept} onClick={accept}>
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
