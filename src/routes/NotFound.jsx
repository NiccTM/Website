import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  // Without this the 404 inherited the home page's title and description, so a
  // missing page reported itself to browsers, history and crawlers as the site
  // landing page.
  usePageMeta('Page not found', 'That page does not exist. Return to the home page to browse projects, hardware, archive and photography.')

  return (
    <section
      className="flex flex-col items-start justify-center min-h-[80vh] px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
      style={{ background: 'transparent' }}
    >
      <p
        className="font-mono-data tracking-[0.18em] uppercase mb-4"
        style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
      >
        Error 404
      </p>

      <h1
        className="font-display"
        style={{
          fontSize: 'clamp(6rem, 4rem + 12vw, 18rem)',
          fontWeight: 900,
          lineHeight: 0.88,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
        }}
      >
        404.
      </h1>

      <p
        className="font-sans mt-6 mb-10"
        style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}
      >
        The requested system path does not exist.
      </p>

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono-data text-sm px-5 py-2.5 rounded-lg transition-colors duration-150"
          style={{
            border: '1px solid #007AFF',
            color: '#007AFF',
            background: 'transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,122,255,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-base">arrow_back</span>
          Return to root directory
        </Link>
      </div>
    </section>
  )
}
