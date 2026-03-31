/**
 * UIContext — global command bus + shared playback state.
 *
 * Command types:
 *   SCROLL_TO     payload: 'delorean' | 'bldc' | 'audio' | 'vinyl' | 'ecosort' | 'xr'
 *   EXPLODE       payload: boolean
 *   SET_RPM       payload: number  (33.333 | 45 | 78)
 *   HIGHLIGHT_SPECS  payload: boolean
 *
 * Commands auto-clear after 150 ms so the same cmd can be re-dispatched.
 * `rpm` is persistent state (not a command) — survives between dispatches.
 */
import { createContext, useContext, useState, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [command, setCommand] = useState(null)
  const [rpm,     setRpm]     = useState(33.333)   // default 33⅓ RPM

  const dispatch = useCallback((cmd) => {
    // Handle state mutations inline rather than routing through command TTL
    if (cmd.type === 'SET_RPM') {
      setRpm(cmd.payload)
      return
    }
    setCommand(cmd)
    setTimeout(() => setCommand(null), 150)
  }, [])

  return (
    <UIContext.Provider value={{ command, dispatch, rpm }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
