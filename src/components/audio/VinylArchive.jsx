import { useState, useEffect, useCallback, Suspense } from 'react'
import { lazyWithReload } from '../../utils/lazyWithReload'

const InteractiveTurntable = lazyWithReload(() => import('../3d/InteractiveTurntable'))

// ─── Mock fallback data ───────────────────────────────────────────────────────
// Shown when the Discogs API is unavailable (e.g. missing PAT in dev).
const MOCK_RELEASES = [
  { id: 1, artist: 'Pink Floyd',      title: 'The Dark Side of the Moon', year: 1973, cover_image: null },
  { id: 2, artist: 'Led Zeppelin',    title: 'Led Zeppelin IV',           year: 1971, cover_image: null },
  { id: 3, artist: 'Miles Davis',     title: 'Kind of Blue',              year: 1959, cover_image: null },
  { id: 4, artist: 'The Beatles',     title: 'Abbey Road',                year: 1969, cover_image: null },
  { id: 5, artist: 'David Bowie',     title: 'Heroes',                    year: 1977, cover_image: null },
  { id: 6, artist: 'Radiohead',       title: 'OK Computer',               year: 1997, cover_image: null },
]

// ─── Data fetching with retry ─────────────────────────────────────────────────

function useCollection() {
  const [data,     setData]    = useState([])
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState(null)
  const [isMock,   setIsMock]  = useState(false)
  const [attempt,  setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/discogs')
      .then(async (r) => {
        // Guard the content type before parsing. If /api/* is not being served
        // (no serverless runtime), the SPA catch-all answers with index.html at
        // status 200 -- .json() would then fail with a bare "Unexpected token
        // '<'", which says nothing about the actual problem.
        const isJson = (r.headers.get('content-type') ?? '').includes('application/json')
        if (!isJson) {
          throw new Error(
            `API returned ${r.headers.get('content-type') ?? 'no content-type'} instead of JSON -- the /api routes are not running.`
          )
        }
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error ?? `API ${r.status}`)
        return json
      })
      .then((json) => {
        if (!cancelled) {
          if (!Array.isArray(json)) throw new Error('Unexpected payload shape from /api/discogs.')
          setData(json); setIsMock(false)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [attempt])

  const retry    = useCallback(() => setAttempt((n) => n + 1), [])
  const useMock  = useCallback(() => { setData(MOCK_RELEASES); setIsMock(true); setError(null) }, [])

  return { data, loading, error, isMock, retry, useMock }
}

// ─── Album card ───────────────────────────────────────────────────────────────
/* The sleeve sits in a recessed window with nothing over it; artist and title
   are printed on the panel beneath, always visible (the hover-only gradient
   caption it replaces was invisible on a touch screen). */
function AlbumCard({ release, onClick }) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={() => onClick(release)}
      className="panel flex flex-col text-left overflow-hidden"
      aria-label={`${release.artist} -- ${release.title}`}
    >
      {/* Spans, not divs/ps: a button may only contain phrasing content. */}
      <span className="panel-recessed block p-1 m-1.5 mb-0">
        <span className="block aspect-square overflow-hidden">
          {release.cover_image && !imgError ? (
            <img
              src={release.cover_image}
              alt={`${release.artist} -- ${release.title}`}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center">
              <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: 'var(--text-muted)' }}>album</span>
            </span>
          )}
        </span>
      </span>

      <span className="block px-2 py-1.5 min-w-0">
        <span className="block font-sans text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
          {release.title}
        </span>
        <span className="block font-mono-data truncate" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {release.artist}{release.year ? ` · ${release.year}` : ''}
        </span>
      </span>
    </button>
  )
}

// ─── Skeleton grid -- matches AlbumCard proportions ───────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="panel-recessed animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="aspect-square" />
          <div className="p-2 space-y-1.5">
            <div className="h-2 w-3/4" style={{ background: 'var(--panel-plate)' }} />
            <div className="h-2 w-1/2" style={{ background: 'var(--panel-plate)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry, onMock }) {
  return (
    <div className="panel-recessed p-6 flex flex-col gap-4">
      <div>
        <p className="font-mono-data text-sm" style={{ color: 'var(--text-secondary)' }}>
          {/* Deliberately does not name the server-side env var: that is an
              operator detail, and it shipped in the client bundle where it told
              visitors nothing useful and disclosed internals. */}
          {message.includes('404') || message.includes('500') || message.includes('API')
            ? 'The Discogs collection is temporarily unavailable.'
            : `Collection error: ${message}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={onRetry} className="key key-sm">
          <span aria-hidden="true" className="material-symbols-rounded text-sm">refresh</span>
          Retry
        </button>
        <button onClick={onMock} className="key key-sm">
          <span aria-hidden="true" className="material-symbols-rounded text-sm">library_music</span>
          Load sample records
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VinylArchive() {
  const { data, loading, error, isMock, retry, useMock } = useCollection()
  const [selected, setSelected] = useState(null)

  return (
    <section
      id="section-vinyl"
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="legend legend-module">
            Vinyl Archive
          </h2>
          <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            {loading
              ? 'Fetching collection\u2026'
              : error
              ? 'Collection unavailable'
              : isMock
              ? `${data.length} sample records · Connect Discogs for your full collection`
              : `${data.length} records · Click to inspect on the platter`}
          </p>
        </div>
        <a
          href="https://www.discogs.com/user/NiccTM/collection"
          target="_blank"
          rel="noopener noreferrer"
          className="key key-sm"
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm">open_in_new</span>
          Discogs
        </a>
      </div>

      {loading && <SkeletonGrid />}
      {error && <ErrorState message={error} onRetry={retry} onMock={useMock} />}

      {!loading && !error && data.length > 0 && (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {data.map((release) => (
            <AlbumCard key={release.id} release={release} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* R3F Turntable modal */}

        {selected && (
          <Suspense fallback={null}>
            <InteractiveTurntable
              release={selected}
              onClose={() => setSelected(null)}
            />
          </Suspense>
        )}

    </section>
  )
}
