import { Suspense, useCallback, useEffect, useState } from 'react'
import { lazyWithReload } from '../utils/lazyWithReload'
import { usePageMeta } from '../hooks/usePageMeta'
import { createPortal } from 'react-dom'
import { useAppStore } from '../store/useAppStore'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import ErrorBoundary  from '../components/ui/ErrorBoundary'
import ImageLightbox  from '../components/ui/ImageLightbox'
import { thumbSrc } from '../utils/thumbs'
import Picture from '../components/ui/Picture'
import { REFERENCE_IMAGES } from '../components/hardware/ReferenceGallery'
import HardwareTabs   from '../components/layout/HardwareTabs'
import PageHeader     from '../components/layout/PageHeader'
import MotorLab       from '../components/hardware/MotorLab'
import WaterSenseDive from '../components/hardware/WaterSenseDive'

/* Everything three.js lives in components/hardware/PCBViewer.jsx and is
   imported lazily, so the three.js, react-three-fiber and drei chunks are
   fetched when a visitor presses play rather than on every page load. This is
   the heaviest route on the site; the placeholder called itself "zero GPU
   cost", which was true of the GPU and untrue of the network. */
const PCBViewer = lazyWithReload(() => import('../components/hardware/PCBViewer'))

// ─── BPM controls ─────────────────────────────────────────────────────────────
/* The beat lamp flashes at the BPM the board's LED is pulsing at -- it is the
   same signal, not decoration. Under prefers-reduced-motion it stays lit
   instead of blinking: a lamp flashing up to three times a second is exactly
   the kind of constant motion that setting asks a page to stop. */
function BpmLamp({ bpm }) {
  const reducedMotion = usePrefersReducedMotion()
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => {
      setActive(true); setTimeout(() => setActive(false), 120)
    }, (60 / bpm) * 1000)
    return () => clearInterval(id)
  }, [bpm, reducedMotion])
  return <span aria-hidden="true" className={`lamp ${active || reducedMotion ? 'lamp-ok' : ''}`} />
}

function BpmControl() {
  const bpm = useAppStore((s) => s.bpm); const setBpm = useAppStore((s) => s.setBpm)
  return (
    <div className="flex items-center gap-3">
      {/* h-6 (24px) because a bare range input renders ~16px tall, which is
          under the WCAG 2.2 AA 2.5.8 24x24 floor and is genuinely fiddly to
          drag on a phone. The track stays visually thin; only the hit area
          grows. */}
      <input type="range" min={40} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
        className="w-28 h-6 cursor-pointer" style={{ accentColor: 'var(--status-ok)' }}
        aria-label="Heart rate, beats per minute" />
      {/* aria-hidden: the range input already exposes its value */}
      <span aria-hidden="true" className="display readout px-2 py-1 text-base">{String(bpm).padStart(3, '0')}</span>
      <BpmLamp bpm={bpm} />
    </div>
  )
}

// ─── Reference Gallery strip (horizontal) ────────────────────────────────────
function ReferenceGalleryStrip({ onSyncView }) {
  const [lightbox, setLightbox] = useState(null)
  const rawIndex       = useAppStore((s) => s.galleryIndex)
  const setActiveIndex = useAppStore((s) => s.setGalleryIndex)
  const activeIndex    = Math.min(rawIndex, REFERENCE_IMAGES.length - 1)

  function handleClick(img, idx) {
    setActiveIndex(idx)
    if (img.view && onSyncView) onSyncView(img.view)
  }

  return (
    <div className="mt-6">
      {/* Strip header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-3">
        <p className="legend legend-rule flex-1 min-w-[14rem]" style={{ color: 'var(--text-muted)' }}>
          Altium Reference Gallery
        </p>
        <p className="font-mono-data text-sm" style={{ color: 'var(--text-secondary)' }}>
          Click to sync 3D view · Hover to zoom
        </p>
      </div>

      {/* Horizontal thumbnail row */}
      {/* role/label so the strip announces itself as a group. No tabIndex on
          the container: its children are real buttons now, so it already has
          keyboard access and adding a tab stop here would only put an extra,
          useless stop in front of them.

          Below sm the strip becomes a grid. With two 220px tiles it showed one
          tile and a sliver of the second at 390px, and nothing said the sliver
          scrolled. There are only two images, so on a phone both just show:
          stacked under 480px, side by side from there. Side by side at 390 made
          156px tiles, too small for their own furniture -- the zoom key landed
          on the Active badge, and at 320 the label wrapped over the render. */}
      <div
        className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 sm:flex sm:overflow-x-auto pb-1"
        role="group"
        aria-label="Altium reference gallery"
      >
        {REFERENCE_IMAGES.map((img, i) => (
          /* Two SIBLING buttons, not a clicking tile with a clicking overlay
             inside it.

             The zoom overlay used to be inset-0 with its own onClick and a
             stopPropagation. It is invisible at rest but opacity: 0 still
             receives pointer events, so it covered the whole tile and ate every
             click -- measured: pointer-events computed `auto` at opacity 0.
             The tile's own handler could therefore never run by mouse, which
             means "Click to sync 3D view" in the caption above was simply not
             true for anyone using a mouse.

             Making them siblings fixes that and the keyboard gap at once: two
             separate actions need two separate controls, and a <button> cannot
             be nested inside another <button>. */
          <div
            key={i}
            className="relative group overflow-hidden border shrink-0 min-w-0 sm:w-[220px]"
            style={{
              borderRadius: 'var(--radius-control)',
              borderColor: i === activeIndex ? 'var(--status-ok)' : 'var(--seam)',
              boxShadow:   i === activeIndex ? '0 0 0 1px var(--status-ok)' : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => handleClick(img, i)}
              aria-label={`Sync the 3D view to ${img.label}`}
              aria-pressed={i === activeIndex}
              className="block w-full cursor-pointer"
            >
            <Picture
              src={thumbSrc(img.src)}
              /* alt="" on purpose: the label is rendered as visible text on
                 the plate below, and the button wrapping this image already
                 names the action. A non-empty alt here makes a screen reader
                 announce the same words twice (axe: image-redundant-alt). */
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full object-cover"
              /* Every render is shown in its true colour. Selection is carried
                 by the green frame, the Active plate and aria-pressed -- not by
                 greying out the renders that are not selected. */
              style={{ aspectRatio: '16/9' }}
            />

            {/* A solid plate, not a gradient, and white text rather than
                --text-primary.

                Two faults here. The label took --text-primary, which is
                near-black in light mode, while the scrim under it is a hardcoded
                DARK gradient in both themes -- so light mode put near-black text
                on a near-black strip over a photograph. And a gradient scrim
                only reaches full strength at its bottom edge, so the text sat on
                whatever partial tint happened to fall behind it.

                A plate makes the backdrop knowable instead of leaving it to the
                photograph, which is the same reasoning already applied to the
                3D viewer's caption. */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: 'rgba(3,7,18,0.82)' }}>
              <p className="font-mono-data text-xs" style={{ color: 'rgba(255,255,255,0.95)' }}>{img.label}</p>
            </div>

            {/* Active badge */}
            {i === activeIndex && (
              <div className="absolute top-2 right-2">
                {/* --accent-on-dark: this badge is a dark green plate in BOTH
                    themes, and the light-mode accent is a dark blue that sat on
                    it at roughly 2:1. */}
                <span className="legend flex items-center gap-1.5 px-1.5 py-0.5"
                  style={{ background: 'var(--display-bg)', color: 'var(--display-phosphor)', borderRadius: 'var(--radius-control)' }}>
                  <span aria-hidden="true" className="lamp lamp-ok" />Active
                </span>
              </div>
            )}

            {/* Sync icon */}
            {img.view && (
              <div className="absolute top-2 left-2">
                <span aria-hidden="true" className="material-symbols-rounded text-sm"
                  style={{ color: 'var(--display-phosphor)' }}>sync</span>
              </div>
            )}
            </button>

            {/* Zoom, as its own control in the corner rather than an invisible
                sheet over the whole tile. Bottom-left so it clears the ACTIVE
                badge and the sync icon. */}
            <button
              type="button"
              onClick={() => setLightbox(img)}
              aria-label={`Open ${img.label} full size`}
              className="absolute bottom-9 right-2 grid place-items-center w-8 h-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150"
              style={{
                background: 'rgba(7,16,12,0.85)',
                border: '1px solid rgb(var(--display-phosphor-rgb) / 0.4)',
                borderRadius: 'var(--radius-control)',
              }}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-base" style={{ color: 'var(--accent-on-dark)' }}>zoom_in</span>
            </button>
          </div>
        ))}
      </div>

      {/* Caption for active image */}
      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--text-primary)' }}>{REFERENCE_IMAGES[activeIndex].label}</span>
        &nbsp;·&nbsp;{REFERENCE_IMAGES[activeIndex].caption}
      </p>

        {lightbox && <ImageLightbox src={lightbox.src} label={lightbox.label} caption={lightbox.caption} onClose={() => setLightbox(null)} />}

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HardwarePage() {
  usePageMeta('Hardware Lab', 'An Altium PCB you can inspect in 3D, a hand-wound three-phase BLDC motor, and a water-contact sensor for a UAS team. Altium Designer and embedded C.')
  const [canvasActive, setCanvasActive] = useState(false)

  // xray lives in the global store so the 3D scene and the toggle stay in sync
  const xray      = useAppStore((s) => s.pcbXray)
  const setXray   = useAppStore((s) => s.setPcbXray)
  const setPcbCommand = useAppStore((s) => s.setPcbCommand)

  const handleSyncView = useCallback((view) => {
    if (view === 'topdown') setXray(true)
    setPcbCommand(view)
  }, [setPcbCommand, setXray])

  return (
    <section className="relative z-10 px-5 pt-12 pb-4 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full" id="section-hardware">

      {/* Replaces an sr-only h1: the page used to open straight on the "PCB Lab
          -- Digital Twin" control strip, so a visitor got a toolbar before they
          got any statement of what the page was. */}
      <PageHeader
        eyebrow="Altium · Embedded C · WebGL"
        title="Hardware Lab"
        intro="Boards, motors and sensors: an Altium PCB you can orbit in 3D, a three-phase motor wound from scratch, and a water-contact sensor built for a UAS. In the gallery below the board, clicking a reference image swings the 3D view round to the orientation it was captured from."
      />

      <HardwareTabs />

      {/* ── PCB inspection: the instrument ──
          One panel holds the whole station: its legend, the control bank, the
          viewing window and the key. Controls are grouped the way a bench
          instrument groups them, each group named by a legend above it. */}
      <section aria-labelledby="pcb-heading" className="panel p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-4">
        <h2 id="pcb-heading" className="legend" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
          PCB Inspection · Assembly View
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Heart-rate PCB · Altium Designer 24 · Drag to orbit · Scroll to zoom
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mb-4">
        <div role="group" aria-labelledby="pcb-mode-label">
          <p id="pcb-mode-label" className="legend mb-1.5" style={{ color: 'var(--text-muted)' }}>Mode</p>
          <div className="flex">
            {/* setXray(value), never an updater function: setPcbXray is a
                zustand action that stores whatever it is given, and a stored
                function is truthy -- that bug once made X-Ray impossible to
                switch off. Two keys, each setting an explicit value, cannot
                reintroduce it. */}
            <button type="button" onClick={() => setXray(false)} aria-pressed={!xray} className="key key-sm"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
              Normal
            </button>
            <button type="button" onClick={() => setXray(true)} aria-pressed={xray} className="key key-sm"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: '-1px' }}>
              X-Ray
            </button>
          </div>
        </div>

        <div role="group" aria-labelledby="pcb-camera-label">
          <p id="pcb-camera-label" className="legend mb-1.5" style={{ color: 'var(--text-muted)' }}>Camera</p>
          <button type="button" onClick={() => { setPcbCommand('reset'); setXray(false) }} className="key key-sm">
            Reset view
          </button>
        </div>

        <div role="group" aria-labelledby="pcb-bpm-label">
          <p id="pcb-bpm-label" className="legend mb-1.5" style={{ color: 'var(--text-muted)' }}>BPM</p>
          <BpmControl />
        </div>
      </div>

      {/* ── PCB Digital Twin -- full width ── */}
      <div
        className="display relative w-full aspect-video sm:aspect-auto sm:h-[60vh] sm:max-h-[820px] overflow-hidden"
      >
        {canvasActive ? (
          <ErrorBoundary label="PCB Canvas" fallback={(err) => (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <span aria-hidden="true" className="material-symbols-rounded text-4xl" style={{ color: 'var(--display-fault)' }}>memory</span>
              <p className="font-mono-data text-sm text-center max-w-xs" style={{ color: 'var(--display-text)' }}>
                Failed to load 3D viewer
              </p>
              <p className="font-mono-data text-sm text-center max-w-sm" style={{ color: 'var(--display-text)', opacity: 0.85 }}>
                {err?.message || 'WebGL error. Try refreshing the page.'}
              </p>
            </div>
          )}>
            {/* The chunk is only requested at this point, so a visitor on a
                slow connection needs to be told something is happening. */}
            <Suspense fallback={(
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <span aria-hidden="true" className="material-symbols-rounded animate-spin text-3xl"
                      style={{ color: 'var(--accent-on-dark)' }}>progress_activity</span>
                <p className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  Loading 3D viewer…
                </p>
              </div>
            )}>
              <PCBViewer xray={xray} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          /* Inactive placeholder -- zero GPU cost.

             A <button>, not a <div onClick>. It was a div, which meant the
             single most important control on the page could not be reached by
             keyboard at all: no tab stop, no Enter/Space, and nothing announced
             to a screen reader. w-full h-full keeps the whole frame clickable
             exactly as before. */
          <button
            type="button"
            className="relative flex items-center justify-center w-full h-full cursor-pointer group overflow-hidden"
            style={{ background: 'transparent', outlineOffset: '-4px' }}
            onClick={() => setCanvasActive(true)}
            aria-label="Activate the interactive 3D PCB viewer"
          >
            {/* PCB preview photo. Above the fold, so still eager and still
                high priority: the gallery strip, the motor panels and the
                three.js chunk all compete for the same connection.

                thumbSrc, not displaySrc. The display tier is the source's full
                1476px and weighed 177 KB; this renders 348 CSS px wide, and it
                is drawn at brightness(0.35) behind an overlay, so the extra
                pixels were buying nothing at all. The 800px thumb has an AVIF
                sibling, which <Picture> offers -- 177 KB becomes roughly 20.

                The route's LCP element is not this image, despite what the
                comment here used to claim: Lighthouse reports it as the intro
                paragraph, held up behind images saturating the connection. */}
            <Picture
              src={thumbSrc('/Screenshot 2026-03-31 125242.jpg')}
              alt="PCB preview"
              fetchpriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
              style={{ filter: 'brightness(0.35) saturate(0.6)' }}
            />

            {/* Click-to-activate overlay */}
            <span className="relative flex flex-col items-center gap-4 z-10">
              {/* The triangle is an inline SVG, not the material-symbols
                  play_arrow ligature. Icon ligatures lay out as their own name
                  until the 67 KB icon font arrives, and this one is both above
                  the fold and the largest thing on the page -- it rendered as
                  the word "pla", clipped mid-letter by the 1em box. The icon
                  font is on font-display: block now so nothing shows text any
                  more, but "shows nothing" is still wrong for the primary
                  control of the route. Twelve bytes of path beat a 67 KB
                  dependency for a shape this simple.

                  The path is nudged right of geometric centre on purpose: a
                  triangle's visual weight sits behind its tip, so centring its
                  bounding box makes it look like it is sliding left. Centroid
                  here is x=12.33 in a box centred on 12. */}
              <span
                className="flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 ease-out group-hover:scale-[1.08]"
                style={{
                  background: 'radial-gradient(circle at 50% 35%, rgb(var(--accent-on-dark-rgb) / 0.30), rgb(var(--accent-on-dark-rgb) / 0.12))',
                  border: '1px solid rgb(var(--accent-on-dark-rgb) / 0.55)',
                  /* Three shadows doing three jobs: a wide soft ring that reads
                     as a halo against the board photo, a drop shadow to lift the
                     disc off it, and an inset top highlight so the disc looks
                     like a physical lens rather than a flat swatch. */
                  boxShadow: '0 0 0 12px rgb(var(--accent-on-dark-rgb) / 0.10), 0 0 28px 4px rgb(var(--accent-on-dark-rgb) / 0.18), 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgb(255 255 255 / 0.22)',
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-9 h-9"
                  style={{ fill: 'var(--accent-on-dark)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
                >
                  <path d="M9 5.5 19 12 9 18.5Z" />
                </svg>
              </span>
              {/* On its own plate, not floating on the photograph. Two earlier
                  attempts were not enough: theme text was near-black in light
                  mode, and plain white with a shadow still varied from 16.5:1
                  over the dark board to 1.55:1 where a bright component sat
                  behind it, measured off the rendered pixels. A text-shadow
                  reads better to the eye but contributes nothing to contrast.
                  A translucent plate makes the backdrop knowable instead of
                  whatever the render happens to put there. */}
              {/* span, not div/p. The wrapper is a <button> now, and a button's
                  content model is phrasing content -- a <p> inside it is invalid
                  and browsers will close the button early to recover, which
                  silently drops the rest of the overlay out of the control. */}
              <span
                className="block text-center px-4 py-2.5 rounded-lg"
                style={{
                  background: 'rgba(7, 16, 12, 0.88)',
                  border: '1px solid rgb(var(--accent-on-dark-rgb) / 0.22)',
                }}
              >
                <span className="block font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.94)' }}>
                  Click to activate 3D viewer
                </span>
                <span className="block font-mono-data text-xs mt-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  PCB.glb · WebGL · Interactive
                </span>
              </span>
            </span>
          </button>
        )}

        {/* Pause button -- visible only when canvas is running */}
        {canvasActive && (
          <button
            type="button"
            onClick={() => setCanvasActive(false)}
            className="key key-sm absolute top-3 right-3"
            aria-label="Pause 3D viewer"
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">pause</span>
            Pause
          </button>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
        {[
          { color: 'rgba(255,245,220,0.9)', label: 'LED dome, pulses with BPM' },
          { color: 'rgba(6,95,70,0.5)',     label: 'Board body, semi-transparent in X-Ray mode' },
          { color: 'var(--status-ok)',       label: 'Click a reference image to sync 3D orientation' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span aria-hidden="true" className="inline-block w-3 h-3" style={{ background: color, border: '1px solid var(--seam)', borderRadius: '2px' }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Altium Reference Gallery strip ── */}
      <ReferenceGalleryStrip onSyncView={handleSyncView} />
      </section>

      {/* ── BLDC Motor -- Technical Deep Dive ── */}
      <MotorLab />

      {/* ── UAS Aerospace -- Water Contact Sensor ── */}
      <WaterSenseDive />

    </section>
  )
}
