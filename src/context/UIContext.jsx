/**
 * UIContext -- shared playback state for the vinyl deck.
 *
 * This used to also be a global command bus (SCROLL_TO / EXPLODE / SET_RPM /
 * HIGHLIGHT_SPECS) driven by the terminal console. That console is gone and
 * nothing else ever dispatched, so the bus went with it.
 *
 * `rpm` is what remains: InteractiveTurntable reads it to derive the disc's
 * angular velocity. setRpm is exported so a speed control can be wired up
 * without reintroducing a bus.
 */
import { createContext, useContext, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [rpm, setRpm] = useState(33.333)   // 33⅓ RPM

  return (
    <UIContext.Provider value={{ rpm, setRpm }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
