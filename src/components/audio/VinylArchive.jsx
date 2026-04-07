import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const InteractiveTurntable = lazy(() => import('../3d/InteractiveTurntable'))

// â”€â”€â”€ Mock fallback data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Shown when the Discogs API is unavailable (e.g. missing PAT in dev).
const MOCK_RELEASES = [
  { id: 1, artist: 'Pink Floyd',      title: 'The Dark Side of the Moon', year: 1973, cover_image: null },
  { id: 2, artist: 'Led Zeppelin',    title: 'Led Zeppelin IV',           year: 1971, cover_image: null },
  { id: 3, artist: 'Miles Davis',     title: 'Kind of Blue',              year: 1959, cover_image: null },
  { id: 4, artist: 'The Beatles',     title: 'Abbey Road',                year: 1969, cover_image: null },
  { id: 5, artist: 'David Bowie',     title: 'Heroes',                    year: 1977, cover_image: null },
  { id: 6, artist: 'Radiohead',       title: 'OK Computer',               year: 1997, cover_image: null },
]

// â”€â”€â”€ Data fetching with retry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (!cancelled) { setData(json); setIsMock(false) }
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

// â”€â”€â”€ Stagger config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const gridItem = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// â”€â”€â”€ Album card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AlbumCard({ release, onClick }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.button
      variants={gridItem}
      whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(release)}
      className="group relative aspect-square rounded-lg overflow-hidden border-subtle text-left focus:outline-none focus-visible:ring-2"
      style={{ background: 'var(--bg-surface-2)', '--tw-ring-color': 'var(--accent)' }}
      aria-label={`${release.artist} â€” ${release.title}`}
    >
      {release.cover_image && !imgError ? (
        <img
          src={release.cover_image}
          alt={`${release.artist} â€” ${release.title}`}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: 'var(--text-muted)' }}>album</span>
        </div>
      )}

      <div
        className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to top, rgba(0,20,60,0.75) 0%, transparent 60%)' }}
      >
        <p className="font-sans text-sm font-medium leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
          {release.title}
        </p>
        <p className="font-mono-data truncate" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>
          {release.artist}{release.year ? ` Â· ${release.year}` : ''}
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>
          radio_button_checked
        </span>
      </div>
    </motion.button>
  )
}

// â”€â”€â”€ Skeleton grid â€” matches AlbumCard dimensions exactly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg relative overflow-hidden border-subtle"
          style={{ background: 'var(--bg-surface-2)', animationDelay: `${i * 40}ms` }}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
              animationDelay: `${i * 80}ms`,
            }}
          />
          {/* Fake title bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1">
            <div className="h-1.5 rounded-full w-3/4" style={{ background: 'var(--bg-surface-3)' }} />
            <div className="h-1 rounded-full w-1/2" style={{ background: 'var(--bg-surface-3)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// â”€â”€â”€ Error state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ErrorState({ message, onRetry, onMock }) {
  return (
    <div className="rounded-xl border-subtle p-6 flex flex-col gap-4" style={{ background: 'var(--bg-surface-1)' }}>
      <div>
        <p className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
          {message.includes('404') || message.includes('500') || message.includes('API')
            ? 'Discogs API unavailable â€” check DISCOGS_PAT environment variable.'
            : `Collection error: ${message}`}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 font-mono-data text-sm px-3 py-1.5 rounded-lg border-subtle transition-colors duration-150"
          style={{ color: 'var(--accent)', background: 'var(--bg-surface-2)' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm">refresh</span>
          Retry
        </button>
        <button
          onClick={onMock}
          className="flex items-center gap-1.5 font-mono-data text-sm px-3 py-1.5 rounded-lg border-subtle transition-colors duration-150"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm">library_music</span>
          Load sample records
        </button>
      </div>
    </div>
  )
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function VinylArchive() {
  const { data, loading, error, isMock, retry, useMock } = useCollection()
  const [selected, setSelected] = useState(null)

  return (
    <motion.section
      id="section-vinyl"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="font-mono-data tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Vinyl Archive
          </h2>
          <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            {loading
              ? 'Fetching collectionâ€¦'
              : error
              ? 'Collection unavailable'
              : isMock
              ? `${data.length} sample records Â· Connect Discogs for your full collection`
              : `${data.length} records Â· Click to inspect on the platter`}
          </p>
        </div>
        <a
          href="https://www.discogs.com/user/NiccTM/collection"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono-data text-sm transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm">open_in_new</span>
          Discogs
        </a>
      </div>

      {loading && <SkeletonGrid />}
      {error && <ErrorState message={error} onRetry={retry} onMock={useMock} />}

      {!loading && !error && data.length > 0 && (
        <motion.div
          variants={gridContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {data.map((release) => (
            <AlbumCard key={release.id} release={release} onClick={setSelected} />
          ))}
        </motion.div>
      )}

      {/* R3F Turntable modal */}
      <AnimatePresence>
        {selected && (
          <Suspense fallback={null}>
            <InteractiveTurntable
              release={selected}
              onClose={() => setSelected(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
