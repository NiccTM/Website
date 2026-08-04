import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

/* NO framer-motion in this file, deliberately.
 *
 * AppShell imports NavBar statically, so whatever NavBar imports is on the
 * critical path of every route. framer-motion is 117 KB raw / 40 KB gzip, and
 * it was being pulled in ahead of first paint on the home page to run a nav
 * fade, three hamburger transforms and a drawer height tween -- all of which
 * CSS does natively. Profiling put the main thread 94% idle before FCP, so the
 * cost was never execution; it was 40 KB of critical-path download on a link
 * where every kilobyte is ~5ms.
 *
 * The one thing genuinely lost is the active pill's shared-layout slide, which
 * used layoutId and has no CSS equivalent. It is now a border that transitions
 * in place. See the CSS REPLACEMENTS block in styles/index.css.
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

/* NavLink's own isActive already treats /hardware/reference as inside
   /hardware; the pill was drawn off a bare `pathname === to`, which did not,
   so the Hardware item lost its outline on the sub-route. */
const isSection = (pathname, to) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)

export default function NavBar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const darkMode       = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  return (
    <>
      <nav
        className="anim-rise sticky top-0 z-50 w-full"
        style={{
          '--anim-dur': '0.35s',
          '--rise-from': '-8px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderBottom: '1px solid var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
          paddingTop: '12px',
          paddingBottom: '12px',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between w-full max-w-[1600px] tv:max-w-[2400px] mx-auto px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
        {/* Wordmark -- always visible */}
        <NavLink
          to="/"
          className="font-display text-lg font-bold select-none shrink-0"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          onClick={() => setOpen(false)}
        >
          Nic <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Piraino</span>
        </NavLink>

        {/* Desktop nav links -- hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          <div className="w-px h-4 mr-3" style={{ background: 'var(--border)' }} />
          {ROUTES.filter((r) => r.to !== '/').map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              /* whitespace-nowrap: "Voltage Reference" wrapped to two lines at
                 the md breakpoint, making the bar 24px taller than every other
                 route and splitting the active pill across both lines. */
              className="relative font-sans text-sm px-3 py-1 whitespace-nowrap transition-colors duration-150"
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius)',
                fontWeight: isActive ? 500 : 400,
              })}
            >
              {label}
              {/* Was a layoutId pill that slid between items. That is the one
                  framer-motion feature here with no CSS equivalent, so the
                  slide is gone and the border fades in on the active item
                  instead. */}
              {isSection(pathname, to) && (
                <span
                  className="anim-fade absolute inset-0 pointer-events-none"
                  style={{
                    '--anim-dur': '0.25s',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius)',
                  }}
                />
              )}
            </NavLink>
          ))}
          <div className="w-px h-4 mx-2" style={{ background: 'var(--border)' }} />
          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-lg">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        {/* Mobile hamburger -- visible below md */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span
            className="burger-bar block w-5 h-[1.5px]"
            style={{
              background: 'var(--text-primary)', borderRadius: '1px',
              transform: open ? 'translateY(8px) rotate(45deg)' : 'none',
            }}
          />
          <span
            className="burger-bar block w-5 h-[1.5px]"
            style={{
              background: 'var(--text-primary)', borderRadius: '1px',
              opacity: open ? 0 : 1,
            }}
          />
          <span
            className="burger-bar block w-5 h-[1.5px]"
            style={{
              background: 'var(--text-primary)', borderRadius: '1px',
              transform: open ? 'translateY(-8px) rotate(-45deg)' : 'none',
            }}
          />
        </button>
        </div>
      </nav>

      {/* Mobile drawer. Always mounted now, opened by data-open rather than by
          AnimatePresence; the CSS handles the height tween and takes the
          contents out of the tab order while closed. */}
      <div
        data-open={open ? 'true' : 'false'}
        className="nav-drawer sticky top-[49px] z-40 grid md:hidden overflow-hidden"
        style={{
          background: 'var(--nav-mobile-bg)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          /* none, not a transparent 1px: the closed drawer collapses to exactly
             0 and a leftover border would leave a 1px band under the nav. */
          borderBottom: open ? '1px solid var(--nav-mobile-border)' : 'none',
          boxShadow: open ? 'var(--nav-shadow)' : 'none',
        }}
      >
            {/* A <nav> landmark, not a plain div: the drawer renders outside
                the main <nav> above, so without this the mobile route links
                belong to no navigation landmark at all and a screen-reader
                user browsing by landmark cannot find them. */}
            <nav aria-label="Mobile navigation" className="flex flex-col px-5 py-4 gap-1">
              {ROUTES.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className="font-sans text-base px-4 py-3 rounded-lg transition-colors duration-150"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isActive ? 'rgb(var(--accent-rgb) / 0.10)' : 'transparent',
                    fontWeight: isActive ? 500 : 400,
                  })}
                >
                  {label}
                </NavLink>
              ))}
              <div className="h-px my-1" style={{ background: 'var(--border)' }} />
              {/* Theme toggle -- mobile */}
              <button
                onClick={() => { toggleDarkMode(); setOpen(false) }}
                className="flex items-center gap-2 font-mono-data text-sm px-4 py-3 rounded-lg w-full text-left"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span aria-hidden="true" className="material-symbols-rounded text-base">
                  {darkMode ? 'light_mode' : 'dark_mode'}
                </span>
                {darkMode ? 'Light mode' : 'Dark mode'}
              </button>
            </nav>
      </div>
    </>
  )
}
