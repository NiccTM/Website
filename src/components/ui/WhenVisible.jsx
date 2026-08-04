import { useEffect, useRef, useState } from 'react'

/**
 * Renders children only once they are near the viewport.
 *
 * lazy() decides how a component is CHUNKED; it does not decide when the chunk
 * is fetched. A lazy component inside <Suspense> that is mounted on first
 * render downloads immediately, whatever its position on the page. Both flow
 * diagrams sat at the bottom of their routes and did exactly that, so the
 * React Flow chunk -- about 43 KB gzip -- was competing with the text and
 * images at the top of the page that people actually see first.
 *
 * Wrapping the mount in an IntersectionObserver is what defers the fetch. This
 * is the same fix already applied to the three.js viewer on /hardware, which is
 * gated behind a click rather than a scroll.
 *
 * rootMargin is deliberately large: the chunk should be requested and rendered
 * BEFORE the placeholder scrolls into view, so a reader never waits and the
 * expansion from placeholder to real content happens off-screen, where a
 * layout shift costs nothing. Both routes measure CLS 0 and must stay there.
 */
export default function WhenVisible({ children, rootMargin = '600px', minHeight = 260 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return

    // Without IntersectionObserver, render immediately. Hiding content behind
    // a feature check would be worse than loading it eagerly.
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible, rootMargin])

  // The reserved height only applies before mount; afterwards the real content
  // sets its own, so this never fights the component it is wrapping.
  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  )
}
