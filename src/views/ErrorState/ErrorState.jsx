'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/router'
import styles from './ErrorState.module.css'

// Shared UI for the route error boundaries. `onRetry` re-runs the failed render
// (Next.js passes its `reset` function); the error message is only revealed in a
// collapsed <details> so users see a friendly message first. `title`/`description`
// fall back to the localized defaults when not provided by a caller.
export default function ErrorState({
  title,
  description,
  error,
  onRetry,
  showHome = true,
}) {
  const t = useTranslations('ErrorState')
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.icon} aria-hidden="true">😵‍💫</div>
        <h1 className={styles.title}>{title ?? t('title')}</h1>
        <p className={styles.description}>{description ?? t('description')}</p>

        <div className={styles.actions}>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              {t('retry')}
            </button>
          )}
          {showHome && (
            <Link to="/" className="btn btn-outline">
              {t('home')}
            </Link>
          )}
        </div>

        {error?.message && (
          <details className={styles.details}>
            <summary>{t('details')}</summary>
            <pre>{error.message}{error.digest ? `\n\nRef: ${error.digest}` : ''}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
