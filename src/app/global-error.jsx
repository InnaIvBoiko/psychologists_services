'use client'

import { useEffect } from 'react'

// Last-resort boundary: catches errors thrown by the root layout itself. It
// replaces the whole document, so it must render its own <html>/<body> and can't
// rely on the app chrome or global stylesheet — hence the inline styles.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: 24,
          background: '#f3f3f3',
          color: '#1a1a1a',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 64 }}>😵‍💫</div>
          <h1 style={{ fontSize: 28, margin: '16px 0 12px' }}>Something went wrong</h1>
          <p style={{ color: '#777', marginBottom: 28, lineHeight: 1.6 }}>
            The app ran into an unexpected error. Please try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#FC832C',
              color: '#fff',
              border: 'none',
              borderRadius: 30,
              padding: '14px 36px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
