import { useEffect, useState, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc } from '../../utils/thumbs'
import Picture from '../ui/Picture'

// ─── Digital Twin image pair ──────────────────────────────────────────────────
/* Shared by the /hardware motor section and the /projects/bldc-motor case study.

   The CAD cross-section used to be motor-cad.gif: 800x499, 10 seconds at
   12.5fps, 608 KB, rendered into a panel 165 CSS px wide. It was the largest
   asset on /hardware by a wide margin and, on a throttled link, most of what
   was delaying the route's LCP -- which is a paragraph of TEXT, held up behind
   images saturating the connection rather than by anything about itself.

   Re-encoded to H.264 at 480px it is 37 KB, six percent of the GIF. An
   animation of that length is video, and a video codec compresses it about
   sixteen times better than an image format can: animated WebP at the same
   width only reached 62% of the GIF, which is why this is an <video> rather
   than a format swap.

   It also fixes something the GIF got wrong. A GIF loops forever with no way
   to stop it, which fails WCAG 2.2.2 Pause, Stop, Hide for anything moving
   longer than five seconds. This has a pause control, and does not autoplay at
   all under prefers-reduced-motion. */
const isVideo = (s) => typeof s === 'string' && s.endsWith('.mp4')

export default function DigitalTwinPanel({ src, label, caption, icon, poster }) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const [playing, setPlaying] = useState(!reducedMotion)
  const videoRef = useRef(null)
  const video = isVideo(src)

  /* The prerendered shell cannot know the visitor's motion setting, so it
     ships with autoplay; once the setting is known, stop the clip. */
  useEffect(() => {
    if (!reducedMotion) return
    videoRef.current?.pause()
    setPlaying(false)
  }, [reducedMotion])

  function togglePlay(e) {
    e.stopPropagation()
    const el = videoRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) } else { el.pause(); setPlaying(false) }
  }

  return (
    <>
      <div
        className={`panel flex flex-col overflow-hidden group${video ? '' : ' cursor-zoom-in'}`}
        /* Video panels do not open the lightbox -- it renders an <img>, and the
           clip is already playing at the size it is worth seeing. */
        onClick={() => src && !video && setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* The media well is 4:3, which is exactly the photo's aspect (800x600)
            and NOT the CAD clip's (480x300, so 1.6). object-cover therefore
            cropped 17% of the video's width, 8% off each side -- and that is
            precisely where the model goes: it is not a turntable, it tracks
            left to right across the ten seconds and starts and ends near the
            frame edges. The extremes were being cut off.

            So the video gets object-contain instead, and the well behind it
            takes the render's OWN backdrop rather than the dark navy. Sampled
            off the four corners of the clip: #fbfbfc, #ebedf3, #f5f7f9,
            #f4f5f9. At #f4f5f8 the letterbox bars are invisible against the
            render's own background, so the whole frame shows with no crop and
            no visible bars, and the panel keeps the same height as the photo
            beside it. */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            background: video ? '#f4f5f8' : 'var(--display-bg)',
            aspectRatio: '4/3',
            minHeight: '160px',
          }}
        >
          {video ? (
            <>
              <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay={!reducedMotion}
                loop
                muted
                playsInline
                aria-label={`${label}. ${caption}`}
                className="w-full h-full object-contain"
              />
              <button
                onClick={togglePlay}
                aria-label={playing ? `Pause ${label} animation` : `Play ${label} animation`}
                className="absolute bottom-2 right-2 grid place-items-center w-8 h-8 rounded-full focus:outline-none focus-visible:ring-2"
                /* --accent-on-dark, not --accent. This pill is a near-black
                   plate in BOTH themes, and the light-mode accent is a dark
                   blue that would sit on it at roughly 2:1. That is the exact
                   case --accent-on-dark exists for, and it matters more now
                   that the well behind is light. */
                style={{
                  background: 'rgba(3,7,18,0.72)',
                  color: 'var(--accent-on-dark)',
                  border: '1px solid rgb(var(--accent-on-dark-rgb) / 0.35)',
                  '--tw-ring-color': 'var(--accent-on-dark)',
                }}
              >
                <span aria-hidden="true" className="material-symbols-rounded text-base">
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </>
          ) : src ? (
            <>
              <Picture
                src={thumbSrc(src)}
                alt={label}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                style={{ background: 'rgba(3,7,18,0.45)', opacity: hovered ? 1 : 0 }}
              >
                <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: 'var(--accent)' }}>zoom_in</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-30">
              <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: 'var(--accent)' }}>{icon}</span>
              <span className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
            </div>
          )}
        </div>
        {/* Theme tokens, not white. This caption block sits on the PANEL, whose
            background is rgba(255,255,255,0.04) -- effectively the page colour.
            White works in dark mode and is invisible in light: measured 1.44:1
            and 1.32:1 against the light palette, where AA wants 4.5. The
            captions over photographs elsewhere on the site keep their white,
            because those have a dark scrim under them. */}
        <div className="px-3 py-2" style={{ borderTop: '1px solid var(--seam)' }}>
          <p className="legend" style={{ color: 'var(--text-primary)' }}>{label}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{caption}</p>
        </div>
      </div>

        {open && <ImageLightbox src={src} label={label} caption={caption} onClose={() => setOpen(false)} />}

    </>
  )
}
