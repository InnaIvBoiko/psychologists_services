import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './CookieBanner.module.css'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
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
    <div className={styles.banner} role="region" aria-label="Cookie consent">
      <div className={styles.inner}>
        <p className={styles.text}>
          We use cookies to improve your experience and keep you logged in.
          By continuing, you agree to our{' '}
          <Link to="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          .
        </p>
        <div className={styles.actions}>
          <button className={styles.decline} onClick={decline}>
            Decline
          </button>
          <button className={styles.accept} onClick={accept}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
