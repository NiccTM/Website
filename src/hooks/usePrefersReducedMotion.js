import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Tracks the OS "reduce motion" setting, and keeps tracking it -- the user can
 * change it while the page is open.
 *
 * index.css already collapses CSS animations and transitions under this query,
 * but that cannot stop a setInterval swapping React state: the hero carousel
 * kept advancing regardless. Anything driven by a timer has to consult this
 * explicitly.
 *
 * Returns false during SSR//pre-hydration, so behaviour is unchanged where
 * matchMedia is unavailable.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(QUERY).matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
