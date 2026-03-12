import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.code}>
          4<span className={styles.icon}>🧠</span>4
        </div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.description}>
          The page you are looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <Link to="/" className={styles.btn}>
          Go to Home
        </Link>
      </div>
    </div>
  )
}
