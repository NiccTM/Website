import { useMemo } from 'react'

/**
 * Returns true if the device supports hover (mouse/trackpad).
 * Returns false on touch-only devices (phones, tablets, TVs without pointer).
 * Evaluated once at mount — pointer capability doesn't change mid-session.
 */
export function useCanHover() {
  return useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    []
  )
}
