import { useEffect } from 'react'

/**
 * Updates document <title> and <meta name="description"> on route change.
 * Reverts to site defaults on unmount so navigating back to "/" is clean.
 */
const DEFAULT_TITLE = 'Nic Piraino | Hardware Engineering & System Design'
const DEFAULT_DESC  = 'Nic Piraino — Hardware Engineering & System Design. Embedded systems, PCB design, audio electronics, and full-stack engineering.'

export function usePageMeta(title, description) {
  useEffect(() => {
    const fullTitle = title ? `Nic Piraino | ${title}` : DEFAULT_TITLE
    document.title = fullTitle

    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', description ?? DEFAULT_DESC)

    return () => {
      document.title = DEFAULT_TITLE
      if (tag) tag.setAttribute('content', DEFAULT_DESC)
    }
  }, [title, description])
}
