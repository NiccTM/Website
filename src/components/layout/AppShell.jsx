import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from './NavBar'
import MeshBackground from './MeshBackground'
import { useAppStore } from '../../store/useAppStore'
import { contact } from '../../data/config'

export default function AppShell() {
  const overclock = useAppStore((s) => s.overclock)
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
    <div
      className="relative min-h-screen w-full"
      style={{
        background: 'var(--bg-base)',
        filter: overclock ? 'sepia(1) saturate(6) hue-rotate(310deg) brightness(0.88)' : 'none',
        transition: 'filter 0.25s ease-in-out',
      }}
    >
      <MeshBackground />
      <NavBar />
      <main className="relative flex flex-col w-full" style={{ zIndex: 1 }}>
        <Outlet />
      </main>

      {/* ── Global footer ── */}
      <footer
        className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 md:px-14 lg:px-20 xl:px-28"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Nic Piraino
        </p>
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-1.5 font-mono-data text-xs transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          aria-label="Send email"
        >
          <span className="material-symbols-rounded text-sm">mail</span>
          {contact.email}
        </a>
      </footer>
    </div>
  )
}
