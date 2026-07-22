import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from './NavBar'
import MeshBackground from './MeshBackground'
import { useAppStore } from '../../store/useAppStore'

export default function AppShell() {
  const darkMode  = useAppStore((s) => s.darkMode)

  // Keep data-theme attribute in sync with store
  // CSS defaults are dark (:root), light overrides via [data-theme="light"]
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Ensure no horizontal overflow from any child
  useEffect(() => {
    document.body.style.overflowX = 'hidden'
    return () => { document.body.style.overflowX = '' }
  }, [])

  return (
    /* flex column + flex-1 on <main> pins the footer to the bottom of the
       viewport on short routes. /systems and the 404 page are under a screen
       tall, and the footer was landing mid-page with a band of empty
       background beneath it. MeshBackground is position:fixed, so it stays out
       of the flex flow. */
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      <MeshBackground />

      {/* WCAG 2.4.1 Bypass Blocks (Level A): six nav links plus a theme toggle
          sit ahead of the content on every route, and a keyboard user had to
          tab through all of them on each navigation. Visually hidden until
          focused, at which point it is the first thing in the tab order. */}
      <a href="#main" className="skip-link">Skip to main content</a>

      <NavBar />
      {/* tabIndex={-1} so the skip link can actually move focus here: without
          it the browser scrolls to #main but focus stays on the link, and the
          next Tab lands back in the nav. */}
      <main id="main" tabIndex={-1} className="relative flex flex-col w-full flex-1" style={{ zIndex: 1 }}>
        <Outlet />
      </main>

      {/* ── Global footer ── */}
      <footer
        className="relative z-10 flex items-center px-5 py-5 sm:px-8 md:px-14 lg:px-20 xl:px-28"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Nic Piraino
        </p>
      </footer>
    </div>
  )
}
