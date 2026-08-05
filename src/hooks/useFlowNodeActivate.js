import { useEffect, useRef } from 'react'

/**
 * Makes a React Flow custom node operable by keyboard, not merely focusable.
 *
 * React Flow already puts tabindex="0" and role="button" on the node WRAPPER it
 * renders around a custom node. That is half an affordance: the node takes
 * focus and announces itself as a button, and then Enter does nothing, because
 * the click handler lives on the inner div we render and a keypress on the
 * parent does not reach it. Measured on /projects -- focus the first node,
 * press Enter, the spec panel never opens.
 *
 * A promised interaction that does not work is worse than an absent one: a
 * screen-reader user is told there is a button there. WCAG 2.1.1.
 *
 * The listener goes on the wrapper rather than on our own element because
 * keydown bubbles UP, and the wrapper is the parent -- a handler on the inner
 * div would never see the event. Returns a ref to attach to the node's root.
 *
 * Not solved by nesting a <button>: the wrapper already has role="button", so
 * that would nest one button inside another and produce two tab stops for one
 * thing.
 */
export function useFlowNodeActivate(onActivate) {
  const ref = useRef(null)
  const handler = useRef(onActivate)
  handler.current = onActivate

  useEffect(() => {
    const wrapper = ref.current?.closest('.react-flow__node')
    if (!wrapper) return

    const onKeyDown = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      // Space scrolls the page by default, and React Flow pans on it
      e.preventDefault()
      e.stopPropagation()
      handler.current?.()
    }

    wrapper.addEventListener('keydown', onKeyDown)
    return () => wrapper.removeEventListener('keydown', onKeyDown)
  }, [])

  return ref
}
