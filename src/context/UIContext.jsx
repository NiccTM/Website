/**
 * UIContext — global command bus for Terminal → UI navigation.
 * Keeps the dependency graph flat: Terminal dispatches, sections consume.
 * Commands auto-clear after 150 ms so the same command can be re-dispatched.
 */
import { createContext, useContext, useState, useCallback } from 'react'

const UIContext = createContext(null)

/**
 * Command shape: { type: string, payload?: any }
 *
 * Supported types:
 *   SCROLL_TO   — payload: 'delorean' | 'bldc' | 'audio' | 'vinyl' | 'ecosort' | 'xr'
 *   EXPLODE     — payload: boolean
 */
export function UIProvider({ children }) {
  const [command, setCommand] = useState(null)

  const dispatch = useCallback((cmd) => {
    setCommand(cmd)
    setTimeout(() => setCommand(null), 150)
  }, [])

  return (
    <UIContext.Provider value={{ command, dispatch }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
