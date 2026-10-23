import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  // Without this the 404 inherited the home page's title and description, so a
  // missing page reported itself to browsers, history and crawlers as the site
  // landing page.
  usePageMeta('Page not found', 'That page does not exist. Return to the home page to browse projects, hardware and hobbies.')

  return (
    <section
      className="flex flex-col items-start justify-center min-h-[70vh] px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      <p className="legend legend-rule w-full max-w-xl mb-5" style={{ color: 'var(--text-muted)' }}>
        Error 404
      </p>

      <h1
        className="font-display"
        style={{
          fontSize: 'clamp(4rem, 2.5rem + 8vw, 9rem)',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--text-primary)',
        }}
      >
        404
      </h1>

      <p
        className="font-sans mt-4 mb-8"
        style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.6 }}
      >
        Route not found. The requested resource is not present.
      </p>

      <Link to="/" className="key">
        <span aria-hidden="true" className="material-symbols-rounded text-base">arrow_back</span>
        Return home
      </Link>
    </section>
  )
}
