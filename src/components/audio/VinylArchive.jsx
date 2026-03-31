import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const InteractiveTurntable = lazy(() => import('../3d/InteractiveTurntable'))

// ─── Data fetching ────────────────────────────────────────────────────────────

function useCollection() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/discogs')
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}

// ─── Stagger config ───────────────────────────────────────────────────────────

const gridContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
}

const gridItem = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Album card ───────────────────────────────────────────────────────────────

function AlbumCard({ release, onClick }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.button
      variants={gridItem}
      whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(release)}
      className="group relative aspect-square rounded-lg overflow-hidden border-subtle text-left focus:outline-none focus-visible:ring-2"
      style={{
        background: 'var(--bg-surface-2)',
        '--tw-ring-color': 'var(--accent)',
      }}
      aria-label={`${release.artist} — ${release.title}`}
    >
      {/* Cover art */}
      {release.cover_image && !imgError ? (
        <img
          src={release.cover_image}
          alt={`${release.artist} — ${release.title}`}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-rounded text-3xl" style={{ color: 'var(--text-muted)' }}>
            album
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to top, rgba(3,7,18,0.92) 0%, transparent 60%)' }}>
        <p className="font-sans text-xs font-medium leading-tight truncate"
          style={{ color: 'var(--text-primary)' }}>
          {release.title}
        </p>
        <p className="font-mono-data truncate" style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>
          {release.artist}{release.year ? ` · ${release.year}` : ''}
        </p>
      </div>

      {/* Turntable hint icon */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>
          radio_button_checked
        </span>
      </div>
    </motion.button>
  )
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg animate-pulse"
          style={{ background: 'var(--bg-surface-2)', animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VinylArchive() {
  const { data, loading, error } = useCollection()
  const [selected, setSelected] = useState(null)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24"
    >
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2
            className="font-mono-data tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            Vinyl Archive
          </h2>
          <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            {loading
              ? 'Fetching collection…'
              : error
              ? 'Collection unavailable'
              : `${data.length} records · Click to inspect on the platter`}
          </p>
        </div>

        <a
          href="https://www.discogs.com/user/NiccTM/collection"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono-data text-xs transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <span className="material-symbols-rounded text-sm">open_in_new</span>
          Discogs
        </a>
      </div>

      {/* States */}
      {loading && <SkeletonGrid />}

      {error && (
        <div
          className="rounded-xl border-subtle p-6 text-center"
          style={{ background: 'var(--bg-surface-1)' }}
        >
          <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            {error.includes('404') || error.includes('500')
              ? 'Add DISCOGS_PAT to your environment variables to enable this section.'
              : error}
          </p>
        </div>
      )}

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
