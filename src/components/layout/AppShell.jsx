import { Outlet, Link } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from './NavBar'
import MeshBackground from './MeshBackground'
import { useAppStore } from '../../store/useAppStore'
import { contact, profile } from '../../data/config'

export default function AppShell() {
  const darkMode  = useAppStore((s) => s.darkMode)

  // Keep data-theme attribute in sync with store
  // CSS defaults to LAB (:root); NIGHT is [data-theme="dark"]
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
       viewport on short routes. The 404 page is under a screen tall, and the
       footer was landing mid-page with a band of empty background beneath it.
       MeshBackground is position:fixed, so it stays out of the flex flow. */
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      <MeshBackground />

      {/* WCAG 2.4.1 Bypass Blocks (Level A): five nav links plus a theme toggle
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

      {/* ── Global footer: the instrument's base plate ──
          The colophon lives here rather than in the top nav: it is the
          traditional place for one, and it keeps the main nav at four items.
          The email is the site's one contact method, so it is on every route.
          py-1 keeps every target >= 24px tall (WCAG 2.2 AA 2.5.8). */}
      <footer
        className="relative z-10 w-full mt-8"
        style={{ borderTop: '1px solid var(--chassis-border)', background: 'var(--panel-bg)', boxShadow: 'inset 0 1px 0 var(--bevel-hi)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
          <p className="legend" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Nic Piraino · {profile.location}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Link to="/colophon" className="plate-link py-1 font-mono-data text-sm">Colophon</Link>
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="plate-link py-1 font-mono-data text-sm">
              Résumé
            </a>
            <a href={`mailto:${contact.email}`} className="plate-link flex items-center gap-1.5 py-1 font-mono-data text-sm">
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1rem' }}>mail</span>
              {contact.email}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
