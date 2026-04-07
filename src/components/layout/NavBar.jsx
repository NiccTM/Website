import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

const ROUTES = [
  { to: '/',            label: 'Home' },
  { to: '/projects',    label: 'Projects' },
  { to: '/hardware',    label: 'Hardware' },
  { to: '/archive',     label: 'Archive' },
  { to: '/photography', label: 'Photography' },
  { to: '/systems',     label: 'Systems' },
]

export default function NavBar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const darkMode       = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-50 w-full"
        style={{
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
        <div className="flex items-center justify-between w-full max-w-[1600px] tv:max-w-[2400px] mx-auto px-5 sm:px-8 md:px-12 lg:px-20 xl:px-28 tv:px-40">
        {/* Wordmark â€” always visible */}
        <NavLink
          to="/"
          className="font-display text-lg font-bold select-none shrink-0"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          onClick={() => setOpen(false)}
        >
          Nic <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Piraino</span>
        </NavLink>

        {/* Desktop nav links â€” hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          <div className="w-px h-4 mr-3" style={{ background: 'var(--border)' }} />
          {ROUTES.filter((r) => r.to !== '/').map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative font-sans text-sm px-3 py-1 transition-colors duration-150"
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius)',
                fontWeight: isActive ? 500 : 400,
              })}
            >
              {label}
              {pathname === to && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 pointer-events-none"
                  style={{ border: '1px solid var(--border-accent)', borderRadius: 'var(--radius)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
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

        {/* Mobile hamburger â€” visible below md */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 8 : 0 }}
            transition={{ duration: 0.22 }}
            className="block w-5 h-[1.5px]"
            style={{ background: 'var(--text-primary)', borderRadius: '1px' }}
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1 }}
            transition={{ duration: 0.15 }}
            className="block w-5 h-[1.5px]"
            style={{ background: 'var(--text-primary)', borderRadius: '1px' }}
          />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -8 : 0 }}
            transition={{ duration: 0.22 }}
            className="block w-5 h-[1.5px]"
            style={{ background: 'var(--text-primary)', borderRadius: '1px' }}
          />
        </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="sticky top-[49px] z-40 md:hidden overflow-hidden"
            style={{
              background: 'var(--nav-mobile-bg)',
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              borderBottom: '1px solid var(--nav-mobile-border)',
              boxShadow: 'var(--nav-shadow)',
            }}
          >
            <div className="flex flex-col px-5 py-4 gap-1">
              {ROUTES.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className="font-sans text-base px-4 py-3 rounded-lg transition-colors duration-150"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(88,184,224,0.08)' : 'transparent',
                    fontWeight: isActive ? 500 : 400,
                  })}
                >
                  {label}
                </NavLink>
              ))}
              <div className="h-px my-1" style={{ background: 'var(--border)' }} />
              {/* Theme toggle â€” mobile */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
