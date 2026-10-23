import { useRef, useState } from 'react'

/**
 * ProjectVideo -- local .mp4 player with poster, custom overlay controls,
 * and aspect-ratio lock to prevent layout shift.
 *
 * Props:
 *   src    -- video path under /public, e.g. "/videos/APSC 171-2024-T1C4-16-SW_cmp.mp4"
 *            (only the compressed _cmp.mp4 files are committed; see .gitignore)
 *   poster -- poster image path (shown before first play)
 *   title  -- section heading + aria-label
 *   ratio  -- 'wide' (16/9) | 'cinema' (2.39:1) -- default 'wide'
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
  // With preload="none" nothing is fetched until the viewer asks for it, so
  // "Loading…" must be tied to an actual request rather than to canplay having
  // not fired yet -- otherwise it would sit there permanently, claiming to load
  // something the browser has deliberately not started.
  const [requested, setRequested] = useState(false)

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      setRequested(true)
      v.play().then(() => setPlaying(true)).catch(() => setError(true))
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <section
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      <h2
        className="legend legend-rule mb-2 legend-module"
      >
        {title}
      </h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        APSC 171 · Mechanical Team · SolidWorks assembly showcase
      </p>

      {error ? (
        <div className="panel-recessed p-6 text-center">
          <span aria-hidden="true" className="material-symbols-rounded text-3xl block mb-2" style={{ color: 'var(--text-muted)' }}>
            videocam_off
          </span>
          <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            Video not found. Place the .mp4 in <code>/public/videos/</code>
          </p>
        </div>
      ) : (
        /* A raised frame around a recessed window. The window is the display
           colour, so letterbox bars read as the screen's own black. */
        <div className="panel p-2 sm:p-3">
        <div
          className={`relative w-full ${RATIOS[ratio]} overflow-hidden`}
          style={{ background: 'var(--display-bg)', border: '1px solid #000', borderRadius: 'var(--radius-control)' }}
        >
          {/* Single video element -- native controls always available */}
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            muted
            playsInline
            /* preload="none", not "metadata": browsers cannot know where a
               file's metadata lives, so preload="metadata" fetches a real slice
               of video bytes via Content-Range on page load. For a 38 MB clip
               nobody may play, that is pure waste. The poster carries the
               visual and is itself an LCP candidate in Chromium since Chrome
               116. loading="lazy" defers poster+media too but is Chromium-only,
               so preload="none" does the real work. */
            preload="none"
            loading="lazy"
            onCanPlay={() => setReady(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            aria-label={title}
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Custom play key -- only before first play. It sits on the poster
              with no tint over it: the key is the only thing added to the
              picture, and it stays out of the way until asked for. */}
          {!playing && (
            <button
              onClick={toggle}
              aria-label="Play"
              className="absolute inset-0 flex items-center justify-center w-full h-full"
            >
              <span className="key key-primary" aria-hidden="true">
                <span className="material-symbols-rounded text-lg">play_arrow</span>
                {requested && !ready ? 'Loading…' : 'Play'}
              </span>
            </button>
          )}
        </div>
        </div>
      )}

      {/* Metadata strip */}
      <ul className="flex flex-wrap gap-2 mt-3 list-none">
        {[
          { icon: 'settings',      label: 'V6 Engine Assembly' },
          { icon: 'search',        label: 'Component Research' },
          { icon: 'photo_camera',  label: 'SolidWorks Visualize' },
        ].map(({ icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 font-mono-data text-xs px-2 py-1"
            style={{
              color: 'var(--text-secondary)',
              background: 'var(--panel-plate)',
              border: '1px solid var(--seam)',
              borderRadius: '2px',
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">{icon}</span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}
