'use client'

import { useEffect } from 'react'
import ErrorState from '@/views/ErrorState/ErrorState.jsx'

// Segment error boundary: catches render/data errors in any page below the root
// layout. The shared chrome (header/footer) stays mounted; only the page swaps.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return <ErrorState error={error} onRetry={reset} />
}
