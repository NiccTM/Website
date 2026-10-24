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
  /* Starts false on the client too, and reads the query in the effect. Every
     route is prerendered with false, so reading matchMedia during the first
     render gave a reduced-motion visitor different markup from the shell
     (autoplay, transition times, labels) and a hydration error. */
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    setReduced(mq.matches)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
