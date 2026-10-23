import { useEffect, useState } from 'react'

/* false during the server render and the first client render, true after.
   For attributes that depend on browser-only state (localStorage): rendering
   them only once hydrated keeps the prerendered markup and the first client
   render identical, so React has no mismatch to warn about. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
