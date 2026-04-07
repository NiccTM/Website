import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * ProjectVideo â€” local .mp4 player with poster, custom overlay controls,
 * and aspect-ratio lock to prevent layout shift.
 *
 * Props:
 *   src    â€” video path under /public, e.g. "/videos/APSC 171-2024-T1C4-16-SW.mp4"
 *   poster â€” poster image path (shown before first play)
 *   title  â€” section heading + aria-label
 *   ratio  â€” 'wide' (16/9) | 'cinema' (2.39:1) â€” default 'wide'
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
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ready,   setReady]   = useState(false)
  const [error,   setError]   = useState(false)

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => setError(true))
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      <h2
        className="font-mono-data tracking-widest uppercase mb-2"
        style={{ color: 'var(--accent)' }}
      >
        {title}
      </h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        APSC 171 Â· Mechanical Team Â· SolidWorks assembly showcase
      </p>

      {error ? (
        <div
          className="rounded-xl border-subtle p-6 text-center"
          style={{ background: 'var(--bg-surface-1)' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-3xl block mb-2" style={{ color: 'var(--text-muted)' }}>
            videocam_off
          </span>
          <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            Video not found. Place the .mp4 in <code>/public/videos/</code>
          </p>
        </div>
      ) : (
        /* Aspect-ratio wrapper */
        <div
          className={`relative w-full ${RATIOS[ratio]} rounded-xl border-subtle overflow-hidden`}
          style={{ background: 'var(--bg-surface-1)' }}
        >
          {/* Single video element â€” native controls always available */}
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            muted
            playsInline
            preload="metadata"
            onCanPlay={() => setReady(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            aria-label={title}
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Custom play overlay â€” only before first play */}
          {!playing && (
            <button
              onClick={toggle}
              aria-label="Play"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 w-full h-full transition-opacity duration-200 hover:bg-black/10"
              style={{ background: 'rgba(3,7,18,0.45)' }}
            >
              <span
                className="material-symbols-rounded text-6xl transition-transform duration-150 hover:scale-110"
                style={{ color: 'var(--accent)' }}
              >
                play_circle
              </span>
              {!ready && (
                <span className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
                  Loadingâ€¦
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Metadata strip */}
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { icon: 'settings',      label: 'V6 Engine Assembly' },
          { icon: 'search',        label: 'Component Research' },
          { icon: 'photo_camera',  label: 'SolidWorks Visualize' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 font-mono-data"
            style={{ color: 'var(--text-muted)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </motion.section>
  )
}
