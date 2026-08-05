import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Modal dialog behaviour for an overlay rendered through a portal.
 *
 * Returns a ref to put on the dialog element. Handles the three things a
 * dialog owes a keyboard or screen-reader user, none of which the lightbox or
 * the project modal did:
 *
 *  1. MOVE FOCUS IN. Both overlays render into document.body via a portal, so
 *     focus stayed on the thumbnail behind them. A screen reader carried on
 *     reading the page underneath as though nothing had opened.
 *
 *  2. TRAP TAB. Without this, Tab leaves the dialog and walks the page behind
 *     it -- which is still visible through the backdrop but not meant to be
 *     reachable. WCAG 2.4.3. Wrapping at both ends, so Shift+Tab from the
 *     first element goes to the last rather than escaping backwards.
 *
 *  3. GIVE FOCUS BACK. On close, focus returns to whatever had it before. A
 *     keyboard user who opens the ninth thumbnail and closes it should land
 *     back on the ninth thumbnail, not at the top of the document.
 *
 * The caller still needs role="dialog", aria-modal="true" and an accessible
 * name on the element -- the ref cannot add those without fighting React.
 *
 * Escape is deliberately left to the caller: both components already had it,
 * and the lightbox wants Escape to close a zoomed state first.
 */
export function useDialog() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement

    /* Prefer an explicit close control, else the dialog itself. Focusing the
       container rather than the first link means a screen reader announces the
       dialog's name before its contents, instead of starting mid-way in. */
    const initial = node.querySelector('[data-autofocus]')
      || (node.hasAttribute('tabindex') ? node : node.querySelector(FOCUSABLE))
    initial?.focus?.()

    function onKeyDown(e) {
      if (e.key !== 'Tab') return
      const items = [...node.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (!items.length) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      /* Only restore if the element is still in the document -- the gallery it
         came from may have unmounted while the dialog was open. */
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.()
    }
  }, [])

  return ref
}
