import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { useHydrated } from '../../hooks/useHydrated'

/* NO framer-motion in this file, deliberately: AppShell imports NavBar
 * statically, so anything imported here is on the critical path of every
 * route. Everything below is CSS. See the CSS REPLACEMENTS block in
 * styles/index.css.
 *
 * The bar is the instrument's top rail: the maker's plate on the left, a
 * bank of selector keys for the four sections, and a two-position MODE switch.
 * The labels stay plain words -- Projects, Hardware, Hobbies, About -- because
 * the hardware styling surrounds navigation, it does not rename it.
 */

/* The voltage reference lives under Hardware as /hardware/reference, reached
   from the sub-nav there rather than from a top-level item of its own. */
const ROUTES = [
  { to: '/',         label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/hardware', label: 'Hardware' },
  { to: '/hobbies',  label: 'Hobbies' },
  { to: '/about',    label: 'About' },
]

/* NavLink's own isActive treats /hardware/reference as inside /hardware, and
   sets aria-current="page" when it is -- the .key[aria-current] style keys
   off exactly that, so the latched look and the announced state agree. */
const isSection = (pathname, to) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)

/* LAB / NIGHT as a two-position switch: two real toggle buttons in a labelled
   group. The latched look is drawn from html[data-theme] in CSS (set before
   first paint by theme-init.js), and aria-pressed is only emitted once
   hydrated -- the server cannot know a stored preference, and a pressed state
   that disagreed with the prerendered markup would be a hydration mismatch. */
function ModeSwitch({ onChange, className = '' }) {
  const darkMode    = useAppStore((s) => s.darkMode)
  const setDarkMode = useAppStore((s) => s.setDarkMode)
  const hydrated    = useHydrated()

  const pick = (dark) => { setDarkMode(dark); onChange?.() }

  return (
    <div role="group" aria-label="Display mode" className={`mode-switch flex items-center gap-2 ${className}`}>
      <span aria-hidden="true" className="legend" style={{ color: 'var(--text-muted)' }}>Mode</span>
      <div className="key-bank">
        <button
          type="button"
          onClick={() => pick(false)}
          aria-pressed={hydrated ? !darkMode : undefined}
          className="key key-sm mode-lab"
        >
          <span aria-hidden="true" className="lamp" />
          Lab
        </button>
        <button
          type="button"
          onClick={() => pick(true)}
          aria-pressed={hydrated ? darkMode : undefined}
          className="key key-sm mode-night"
        >
          <span aria-hidden="true" className="lamp" />
          Night
        </button>
      </div>
    </div>
  )
}

function Wordmark({ onClick }) {
  return (
    <NavLink
      to="/"
      onClick={onClick}
      className="flex items-baseline gap-3 shrink-0 select-none py-2"
      style={{ color: 'var(--text-primary)' }}
      aria-label="Nic Piraino, home"
    >
      <span className="legend" style={{ fontSize: '0.95rem', letterSpacing: '0.16em', fontWeight: 700 }}>
        Nic Piraino
      </span>
      {/* The maker's plate under a model name. Decorative restatement of the
          discipline, so it is hidden from the link's accessible name. */}
      <span aria-hidden="true" className="legend hidden sm:inline lg:hidden xl:inline" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
        Electrical Eng.
      </span>
    </NavLink>
  )
}

export default function NavBar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)

  /* Escape closes the drawer and hands focus back to the button that opened
     it, so a keyboard user is never left focused inside a menu that has just
     been hidden. */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // A route change from anywhere (browser back, an in-page link) closes it too.
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <nav
        className="stripe-rail sticky top-0 z-50 w-full"
        style={{
          backgroundColor: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
        }}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-14 w-full max-w-[1600px] tv:max-w-[2400px] mx-auto px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
          <Wordmark onClick={() => setOpen(false)} />

          {/* Desktop (lg up): the key bank and mode switch need ~1000px, so below
              1024 the Menu key is used -- at md (768) the switch was clipped. */}
          <div className="hidden lg:flex items-center gap-6">
            {/* One continuous selector bank, not four loose buttons: the keys share
                a tray and an edge, like a source selector on a front panel. */}
            <div className="key-bank">
              {ROUTES.filter((r) => r.to !== '/').map(({ to, label }) => (
                <NavLink key={to} to={to} className="key key-sm">
                  <span aria-hidden="true" className={`lamp ${isSection(pathname, to) ? 'lamp-ok' : ''}`} />
                  {label}
                </NavLink>
              ))}
            </div>
            <span aria-hidden="true" className="w-px h-6" style={{ background: 'var(--seam)' }} />
            <ModeSwitch />
          </div>

          {/* Mobile menu key */}
          <button
            ref={toggleRef}
            type="button"
            className="key key-sm lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span aria-hidden="true" className="flex flex-col justify-center gap-[3px] w-4">
              <span className="burger-bar block h-[1.5px] w-4" style={{ background: 'currentColor', transform: open ? 'translateY(4.5px) rotate(45deg)' : 'none' }} />
              <span className="burger-bar block h-[1.5px] w-4" style={{ background: 'currentColor', opacity: open ? 0 : 1 }} />
              <span className="burger-bar block h-[1.5px] w-4" style={{ background: 'currentColor', transform: open ? 'translateY(-4.5px) rotate(-45deg)' : 'none' }} />
            </span>
            Menu
          </button>
        </div>
      </nav>

      {/* Mobile drawer. Always mounted, opened by data-open; the CSS handles the
          height tween and takes the contents out of the tab order while closed. */}
      <div
        data-open={open ? 'true' : 'false'}
        className="nav-drawer sticky top-14 z-40 grid lg:hidden overflow-hidden"
        style={{
          background: 'var(--nav-mobile-bg)',
          /* none, not a transparent 1px: the closed drawer collapses to exactly
             0 and a leftover border would leave a 1px band under the nav. */
          borderBottom: open ? '1px solid var(--nav-mobile-border)' : 'none',
        }}
      >
        {/* A <nav> landmark of its own: the drawer renders outside the main
            <nav> above, and without one the mobile links would belong to no
            navigation landmark at all. */}
        <nav id="mobile-nav" aria-label="Mobile navigation" className="flex flex-col px-5 py-4 gap-2">
          {ROUTES.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className="key w-full"
              style={{ justifyContent: 'flex-start' }}
            >
              <span aria-hidden="true" className={`lamp ${isSection(pathname, to) ? 'lamp-ok' : ''}`} />
              {label}
            </NavLink>
          ))}
          <div aria-hidden="true" className="h-px my-2" style={{ background: 'var(--seam)' }} />
          <ModeSwitch onChange={() => setOpen(false)} />
        </nav>
      </div>
    </>
  )
}
