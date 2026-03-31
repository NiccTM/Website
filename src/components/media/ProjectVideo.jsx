import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * ProjectVideo — local .mp4 player with poster, custom controls hint,
 * and aspect-ratio lock to prevent layout shift.
 *
 * Props:
 *   src     — path to video file, e.g. "/videos/APSC 171-2024-T1C4-16-SW.mp4"
 *   poster  — path to poster image (shown before play, prevents layout shift)
 *   title   — accessible label and overlay heading
 *   ratio   — 'wide' (16/9) | 'cinema' (2.39:1) — default 'wide'
 */

const RATIOS = {
  wide:   'pb-[56.25%]',
  cinema: 'pb-[41.84%]',
}

export default function ProjectVideo({
  src,
  poster,
  title = 'Project Video',
  ratio = 'wide',
}) {
  const videoRef  = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [loaded,  setLoaded]  = useState(false)

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  const onEnded = () => setPlaying(false)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24"
    >
      <h2
        className="font-mono-data tracking-widest uppercase mb-2"
        style={{ color: 'var(--accent)' }}
      >
        {title}
      </h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        APSC 171 · Mechanical Team · SolidWorks assembly showcase
      </p>

      {/* Aspect-ratio wrapper — zero layout shift because height is locked via padding trick */}
      <div
        className={`relative w-full ${RATIOS[ratio]} rounded-xl border-subtle overflow-hidden`}
        style={{ background: 'var(--bg-surface-1)' }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="metadata"
          onEnded={onEnded}
          onCanPlay={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-contain"
          aria-label={title}
        />

        {/* Play/pause overlay — only shown when not playing */}
        {!playing && (
          <button
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 w-full h-full transition-opacity duration-200"
            style={{ background: 'rgba(3,7,18,0.55)' }}
          >
            <span
              className="material-symbols-rounded text-5xl transition-transform duration-200 hover:scale-110"
              style={{ color: 'var(--accent)' }}
            >
              play_circle
            </span>
            {!loaded && (
              <span className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
                Loading…
              </span>
            )}
          </button>
        )}

        {/* Pause button (visible on hover while playing) */}
        {playing && (
          <button
            onClick={toggle}
            aria-label="Pause"
            className="absolute inset-0 flex items-center justify-center w-full h-full opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(3,7,18,0.3)' }}
          >
            <span
              className="material-symbols-rounded text-5xl"
              style={{ color: 'var(--accent)' }}
            >
              pause_circle
            </span>
          </button>
        )}

        {/* Native controls as fallback — hidden visually but accessible */}
        <video
          src={src}
          controls
          muted
          playsInline
          className="sr-only"
          aria-label={`${title} (accessible player)`}
        />
      </div>

      {/* Metadata strip */}
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { icon: 'engineering',  label: 'Mechanical Assembly' },
          { icon: 'settings',     label: 'Engine Breakdown' },
          { icon: 'sync_alt',     label: 'Drivetrain Modeling' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 font-mono-data"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="material-symbols-rounded text-sm">{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </motion.section>
  )
}
