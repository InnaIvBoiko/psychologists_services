import { useEffect, useState } from 'react'

// Returns a copy of `value` that only updates after `delay` ms of no changes.
// Useful for search inputs: the input stays responsive while the (expensive)
// filtering/refetch driven by the debounced value runs at most once per pause.
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
