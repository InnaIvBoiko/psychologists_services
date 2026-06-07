'use client'

import { Link } from '@/lib/router'
import styles from './ErrorState.module.css'

// Shared UI for the route error boundaries. `onRetry` re-runs the failed render
// (Next.js passes its `reset` function); the error message is only revealed in a
// collapsed <details> so users see a friendly message first.
export default function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this page. Please try again — if the problem persists, come back in a few minutes.",
  error,
  onRetry,
  showHome = true,
}) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.icon}>😵‍💫</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.actions}>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              Try again
            </button>
          )}
          {showHome && (
            <Link to="/" className="btn btn-outline">
              Go to Home
            </Link>
          )}
        </div>

        {error?.message && (
          <details className={styles.details}>
            <summary>Technical details</summary>
            <pre>{error.message}{error.digest ? `\n\nRef: ${error.digest}` : ''}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
