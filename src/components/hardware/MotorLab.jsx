import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc, avifThumbSrc } from '../../utils/thumbs'
import Picture from '../ui/Picture'

// ─── Challenge / Solution card data ───────────────────────────────────────────
const CHALLENGES = [
  {
    id: 'reluctance',
    icon: 'hub',
    title: 'Magnetic Reluctance Optimization',
    challenge:
      'PLA stator teeth have a relative permeability of ≈ 1, effectively air. High reluctance limited flux density and produced insufficient torque at target RPM.',
    solution:
      'Replaced PLA teeth with iron bolts (μᵣ ≈ 200). The ferromagnetic path concentrates magnetic flux through the air gap, significantly increasing torque density without a winding change.',
    metric: 'μᵣ: 1 → ~200',
  },
  {
    id: 'thermal',
    icon: 'thermostat',
    title: 'Thermal & Material Pivot',
    challenge:
      'Resistive heating under the 30A ESC draw brought winding temperatures near the PLA+ glass transition (Tg ≈ 55°C), risking dimensional deformation of the stator and rotor housing.',
    solution:
      'Upgraded both the base and rotor to PETG HF (Tg ≈ 70°C). PETG HF maintains geometry under sustained thermal load and offers superior layer adhesion for press-fit magnet pockets.',
    metric: 'Tg: 55°C → 70°C',
  },
  {
    id: 'commutation',
    icon: 'electric_bolt',
    title: 'Commutation Alignment',
    challenge:
      'Initial ABCABCABC winding distributed opposing magnetic polarities across adjacent teeth, causing torque cancellation and low-speed oscillation that prevented clean spin-up.',
    solution:
      'Implemented AaABbBCCC winding sequence, grouping same-phase poles to unify magnetic torque vectoring across the air gap, eliminating cancellation and producing smooth commutation.',
    metric: 'ABCABCABC → AaABbBCCC',
  },
]

// ─── Card ─────────────────────────────────────────────────────────────────────
function ChallengeCard({ item, index }) {
  return (
    <motion.div
      className="flex flex-col gap-4 p-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgb(var(--accent-rgb) / 0.12)',
        borderRadius: 'var(--radius)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-rounded text-xl shrink-0 mt-0.5"
          style={{ color: 'var(--accent)' }}
        >
          {item.icon}
        </span>
        <div className="min-w-0">
          <h4
            className="font-sans text-sm font-semibold leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.title}
          </h4>
          <span
            className="font-mono-data text-sm mt-0.5 inline-block"
            style={{ color: 'var(--accent)' }}
          >
            {item.metric}
          </span>
        </div>
      </div>

      {/* Challenge */}
      <div
        className="rounded px-3 py-2.5"
        style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.20)' }}
      >
        <p
          className="font-mono-data text-sm mb-1 tracking-wider uppercase"
          style={{ color: '#FF3B30' }}
        >
          Challenge
        </p>
        <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.challenge}
        </p>
      </div>

      {/* Solution */}
      <div
        className="rounded px-3 py-2.5"
        style={{ background: 'rgb(var(--accent-rgb) / 0.06)', border: '1px solid rgb(var(--accent-rgb) / 0.20)' }}
      >
        <p
          className="font-mono-data text-sm mb-1 tracking-wider uppercase"
          style={{ color: 'var(--accent)' }}
        >
          Solution
        </p>
        <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.solution}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Digital Twin image pair ──────────────────────────────────────────────────
/* The CAD cross-section used to be motor-cad.gif: 800x499, 10 seconds at
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

function DigitalTwinPanel({ src, label, caption, icon, poster }) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const [playing, setPlaying] = useState(!reducedMotion)
  const videoRef = useRef(null)
  const video = isVideo(src)

  function togglePlay(e) {
    e.stopPropagation()
    const el = videoRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) } else { el.pause(); setPlaying(false) }
  }

  return (
    <>
      <div
        className={`flex flex-col overflow-hidden group${video ? '' : ' cursor-zoom-in'}`}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgb(var(--accent-rgb) / 0.12)', borderRadius: 'var(--radius)' }}
        /* Video panels do not open the lightbox -- it renders an <img>, and the
           clip is already playing at the size it is worth seeing. */
        onClick={() => src && !video && setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(2,13,26,0.6)', aspectRatio: '4/3', minHeight: '160px' }}
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
                className="w-full h-full object-cover"
              />
              <button
                onClick={togglePlay}
                aria-label={playing ? `Pause ${label} animation` : `Play ${label} animation`}
                className="absolute bottom-2 right-2 grid place-items-center w-8 h-8 rounded-full"
                style={{ background: 'rgba(3,7,18,0.72)', color: 'var(--accent)', border: '1px solid rgb(var(--accent-rgb) / 0.35)' }}
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
        <div className="px-3 py-2">
          <p className="font-mono-data text-sm font-medium" style={{ color: '#ffffff' }}>{label}</p>
          <p className="font-mono-data text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{caption}</p>
        </div>
      </div>

      <AnimatePresence>
        {open && <ImageLightbox src={src} label={label} caption={caption} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MotorLab() {
  return (
    <div className="mt-10">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 mb-6"
      >
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>settings</span>
        <h3
          className="font-mono-data text-base tracking-widest uppercase"
          style={{ color: 'var(--accent)' }}
        >
          BLDC Motor · Technical Deep Dive
        </h3>
        <div className="flex-1 h-px ml-2" style={{ background: 'rgb(var(--accent-rgb) / 0.12)' }} />
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
          $94.92 / $100 CAD
        </span>
      </motion.div>

      {/* Digital Twin: CAD cross-section + physical prototype */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DigitalTwinPanel
          src="/motor-cad.mp4"
          poster="/motor-cad-poster.jpg"
          label="CAD Cross-Section"
          caption="9-pole stator · 16-pole rotor · Wye winding geometry"
          icon="view_in_ar"
        />
        <DigitalTwinPanel
          src="/motor-proto.jpg"
          label="Physical Prototype"
          caption="PETG HF housing · Iron bolt stator teeth · 24 AWG windings"
          icon="precision_manufacturing"
        />
      </div>

      {/* Full-width motor demo video */}
      <div
        className="overflow-hidden mb-6"
        style={{ background: 'rgba(2,13,26,0.6)', border: '1px solid rgb(var(--accent-rgb) / 0.12)', borderRadius: 'var(--radius)' }}
      >
        <video
          src="/motor_cmp.mp4"
          aria-label="Motor prototype demonstration video"
          /* Was unset, which defaults to preload="metadata" and pulls real
             video bytes for an 11.3 MB file on page load. The poster stands in
             until the viewer actually presses play. */
          preload="none"
          /* Not the display tier: a poster is fetched eagerly -- the loading
             attribute does not apply to it -- so display/ put 1,309 KB on the
             wire before anyone pressed play, and this element is at most 420px
             tall.

             The AVIF rather than the 800px JPEG, and specifically the SAME
             AVIF the DigitalTwinPanel above already renders for this photo, so
             the browser serves it from cache and the poster costs nothing.
             Measured before this: motor-proto.jpg (99 KB) and
             motor-proto.avif (42 KB) both went over the wire, the same
             photograph twice, because <video poster> takes one URL and cannot
             negotiate a format the way <picture> does. A browser with no AVIF
             support now shows no poster frame, which is the whole cost. */
          poster={avifThumbSrc('/motor-proto.jpg') ?? thumbSrc('/motor-proto.jpg')}
          loading="lazy"
          controls
          loop
          playsInline
          className="w-full block"
          style={{ maxHeight: '420px', objectFit: 'cover' }}
        />
        <div className="px-3 py-2">
          <p className="font-mono-data text-sm font-medium" style={{ color: '#ffffff' }}>Motor Demo</p>
          <p className="font-mono-data text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>First spin-up · AaABbBCCC winding sequence · Hobbywing Skywalker 30A V2 ESC</p>
        </div>
      </div>

      {/* Challenge / Solution cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CHALLENGES.map((item, i) => (
          <ChallengeCard key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Spec footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex flex-wrap gap-x-6 gap-y-2 mt-5"
      >
        {[
          { label: 'Topology',  value: '9S / 16P Inrunner' },
          { label: 'Winding',   value: '~200 T/pole · 24 AWG' },
          { label: 'Rₚₕ',       value: '~2.022 Ω' },
          { label: 'Control',   value: 'Arduino + Hobbywing 30A' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
            <span className="font-mono-data text-sm" style={{ color: 'var(--accent)' }}>{value}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
