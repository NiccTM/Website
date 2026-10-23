import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
// fullResSrc aliased: this file already uses `displaySrc` for "what to render
// right now". The 2560px tier is what the lightbox loads -- originals live in
// originals/ and are no longer deployed.
import { thumbSrc, displaySrc as fullResSrc } from '../../utils/thumbs'
import Picture from '../ui/Picture'

// ─── All photos from /public/Remastered Photos/ ───────────────────────────────
const PHOTOS = [
  { src: '/Remastered Photos/Northern Lights.jpg',                    caption: 'Northern Lights' },
  { src: '/Remastered Photos/Kelowna Night Sky.jpg',                  caption: 'Kelowna Night Sky' },
  { src: '/Remastered Photos/Yellow Rolling Clouds.jpg',              caption: 'Yellow Rolling Clouds' },
  { src: '/Remastered Photos/Kelwona Blue & Orange Sky.jpg',          caption: 'Blue & Orange Sky, Kelowna' },
  { src: '/Remastered Photos/Kelwona Blue & Orange Sky Part 2.jpg',   caption: 'Blue & Orange Sky II, Kelowna' },
  { src: '/Remastered Photos/Kelowna Mountains.jpg',                  caption: 'Kelowna Mountains' },
  { src: '/Remastered Photos/Ottawa Night.jpg',                       caption: 'Ottawa Night' },
  { src: '/Remastered Photos/Clouds from Above.jpg',                  caption: 'Clouds from Above' },
  { src: '/Remastered Photos/Clouds from Airplane 1.jpg',             caption: 'Clouds from Airplane' },
  { src: '/Remastered Photos/Clouds.jpg',                             caption: 'Clouds' },
  { src: '/Remastered Photos/Kelwona Pink Sky.jpg',                   caption: 'Pink Sky, Kelowna' },
  { src: '/Remastered Photos/Kelwona Forest.jpg',                     caption: 'Forest, Kelowna' },
  { src: '/Remastered Photos/Kelowna Beach Photo 1.jpg',              caption: 'Kelowna Beach' },
  { src: '/Remastered Photos/Kelowna Boat on Water.jpg',              caption: 'Boat on Water, Kelowna' },
  { src: '/Remastered Photos/Kelowna Falls.jpg',                      caption: 'Kelowna Falls' },
  { src: '/Remastered Photos/Kelowna Helicopter.jpg',                 caption: 'Kelowna Helicopter' },
  { src: '/Remastered Photos/Kelowna Water.jpg',                      caption: 'Kelowna Water' },
  { src: '/Remastered Photos/Kelowna Waterfall.jpg',                  caption: 'Kelowna Waterfall' },
  { src: '/Remastered Photos/Kelwona Trail.jpg',                      caption: 'Trail, Kelowna' },
  { src: '/Remastered Photos/Little River Kelowna.jpg',               caption: 'Little River, Kelowna' },
  { src: '/Remastered Photos/Fox Kit Behind Pot.jpg',                 caption: 'Fox Kit' },
  { src: '/Remastered Photos/Kit Fox in Cliffside.jpg',              caption: 'Kit Fox in Cliffside' },
  { src: '/Remastered Photos/Mother Fox Looking Left.jpg',            caption: 'Mother Fox' },
  { src: '/Remastered Photos/Mother Fox on Pier.jpg',                 caption: 'Mother Fox on Pier' },
  { src: '/Remastered Photos/American Dipper.jpg',                    caption: 'American Dipper' },
  { src: '/Remastered Photos/Bee in Flower.jpg',                      caption: 'Bee in Flower' },
  { src: '/Remastered Photos/Bird on Branch Borckville.jpg',          caption: 'Bird on Branch, Brockville' },
  { src: '/Remastered Photos/Blackbird in Tree.jpg',                  caption: 'Blackbird in Tree' },
  { src: '/Remastered Photos/Blue Berries on Trail.jpg',              caption: 'Blue Berries on Trail' },
  { src: '/Remastered Photos/Bunny with Glimmer in Eye.jpg',          caption: 'Bunny' },
  { src: '/Remastered Photos/Chipmunk with Glimmer in Eye.jpg',       caption: 'Chipmunk' },
  { src: '/Remastered Photos/Junco on Branch.jpg',                    caption: 'Junco on Branch' },
  { src: '/Remastered Photos/Fall Leaves Red.jpg',                    caption: 'Fall Leaves' },
  { src: '/Remastered Photos/White Flowers Blooming in Sun.jpg',      caption: 'White Flowers in Sun' },
  { src: '/Remastered Photos/Pond in Afternoon.jpg',                  caption: 'Pond in Afternoon' },
  { src: '/Remastered Photos/Wintery Trail.jpg',                      caption: 'Wintery Trail' },
  { src: '/Remastered Photos/Wooden Bridge.jpg',                      caption: 'Wooden Bridge' },
  { src: '/Remastered Photos/Pallet Fire.jpg',                        caption: 'Pallet Fire' },
  { src: '/Remastered Photos/Academy Road.jpg',                       caption: 'Academy Road' },
  { src: '/Remastered Photos/Canadian Parliament Building 1.jpg',     caption: 'Parliament, Ottawa' },
  { src: '/Remastered Photos/Canadian Parliament Building 2.jpg',     caption: 'Parliament II, Ottawa' },
  { src: '/Remastered Photos/Canadian Parliament Building 3.jpg',     caption: 'Parliament III, Ottawa' },
  { src: '/Remastered Photos/Full View Ottawa Parliament.jpg',        caption: 'Full View, Ottawa Parliament' },
  { src: '/Remastered Photos/Ottawa Canel.jpg',                       caption: 'Ottawa Canal' },
  { src: '/Remastered Photos/Charleston Lake with Man Fishing.jpg',   caption: 'Charleston Lake' },
  { src: '/Remastered Photos/Little River Brockville.jpg',            caption: 'Little River, Brockville' },
  { src: '/Remastered Photos/Little River Brockville from Pier.jpg',  caption: 'Little River from Pier' },
  { src: '/Remastered Photos/St Lawerence Island with Cross.jpg',     caption: 'St. Lawrence, Island & Cross' },
  { src: '/Remastered Photos/St Lawerence Lily Bay.jpg',              caption: 'St. Lawrence, Lily Bay' },
  { src: '/Remastered Photos/St Lawerence River with Ship in Background.jpg', caption: 'St. Lawrence River' },
  { src: '/Remastered Photos/St Lawerence with Stanley Boat.jpg',     caption: 'St. Lawrence, Stanley Boat' },
  { src: '/Remastered Photos/Small Town from Above.jpg',              caption: 'Small Town from Above' },
  { src: '/Remastered Photos/Waterfall Chute Luke.jpg',               caption: 'Waterfall, Chute Luke' },
  { src: '/Remastered Photos/Waterfall into Pond Chute Luke.jpg',     caption: 'Waterfall into Pond' },

  // ── Wildlife & nature (added 2026-07) ──
  { src: '/Remastered Photos/Black-throated Green Warbler.jpg',              caption: 'Black-throated Green Warbler' },
  { src: '/Remastered Photos/Black-throated Green Warbler Behind Pine.jpg',  caption: 'Black-throated Green Warbler, Behind Pine' },
  { src: '/Remastered Photos/Common Yellowthroat on Branch.jpg',            caption: 'Common Yellowthroat' },
  { src: '/Remastered Photos/Eastern Phoebe on Branch.jpg',                 caption: 'Eastern Phoebe' },
  { src: '/Remastered Photos/Golden-cheeked Warbler.jpg',                   caption: 'Golden-cheeked Warbler' },
  { src: '/Remastered Photos/Tufted Titmouse.jpg',                          caption: 'Tufted Titmouse' },
  { src: '/Remastered Photos/Sparrow on Branch.jpg',                        caption: 'Sparrow on Branch' },
  { src: '/Remastered Photos/Sparrow Looking at Me.jpg',                    caption: 'Sparrow' },
  { src: '/Remastered Photos/Chipmunk w Nut.jpg',                           caption: 'Chipmunk with Nut' },
  { src: '/Remastered Photos/Northern Leopard Frog Behind Grass.jpg',       caption: 'Northern Leopard Frog' },
  { src: '/Remastered Photos/Fat Tadpole on Branch.jpg',                    caption: 'Tadpole on Branch' },
  { src: '/Remastered Photos/Canadian Tiger Swallowtail Butterfly.jpg',     caption: 'Canadian Tiger Swallowtail' },
  { src: '/Remastered Photos/Dragonfly.jpg',                                caption: 'Dragonfly' },
  { src: '/Remastered Photos/Eastern Red Columbine.jpg',                    caption: 'Eastern Red Columbine' },
  { src: '/Remastered Photos/White Trillium.jpg',                           caption: 'White Trillium' },
  { src: '/Remastered Photos/Dandelion.jpg',                                caption: 'Dandelion' },
  { src: '/Remastered Photos/Dandelion White.jpg',                          caption: 'Dandelion, Seed Head' },
  { src: '/Remastered Photos/Lily Pads.jpg',                                caption: 'Lily Pads' },
  { src: '/Remastered Photos/Lilypads in Pond.jpg',                         caption: 'Lily Pads in Pond' },
  { src: '/Remastered Photos/Pond with Trees.jpg',                          caption: 'Pond with Trees' },
  { src: '/Remastered Photos/Creek w Flair.jpg',                            caption: 'Creek' },
  { src: '/Remastered Photos/River at Night.jpg',                           caption: 'River at Night' },
  { src: '/Remastered Photos/Kelowna Sunset with Airplane.jpg',             caption: 'Kelowna Sunset with Airplane' },
  { src: '/Remastered Photos/Moon in Daylight.jpg',                         caption: 'Moon in Daylight' },
  { src: '/Remastered Photos/Pink Clouds and Moon.jpg',                     caption: 'Pink Clouds and Moon' },
  { src: '/Remastered Photos/Blue & Yellow Sky.jpg',                        caption: 'Blue & Yellow Sky' },
  { src: '/Remastered Photos/Blue & Yellow Sky with Streetlight.jpg',       caption: 'Blue & Yellow Sky with Streetlight' },
  { src: '/Remastered Photos/Rusty AC Controls.jpg',                        caption: 'Rusty AC Controls' },

  // ── Second 2026-07 batch ──
  // Captions carry the correct spelling where the filename does not: the files
  // on the source drive read "Catail", "Great-crest" and "Lawerence". Renaming
  // them would orphan the generated thumbs/ and display/ tiers, so the filename
  // stays as-is and only the visible text is corrected -- the same convention
  // the older "St Lawerence" entries above already follow.
  { src: '/Remastered Photos/Great-crest Flycatcher Sitting.jpg',           caption: 'Great Crested Flycatcher' },
  { src: '/Remastered Photos/Great-crest Flycatcher on Branch.jpg',         caption: 'Great Crested Flycatcher on Branch' },
  { src: '/Remastered Photos/Hummingbird Clearwing Moth.jpg',               caption: 'Hummingbird Clearwing Moth' },
  { src: '/Remastered Photos/Lilypad Flower with Dragonfly.jpg',            caption: 'Lily Pad Flower with Dragonfly' },
  { src: '/Remastered Photos/Lily Flower.jpg',                              caption: 'Lily Flower' },
  { src: '/Remastered Photos/Red Berries with Blue Sky.jpg',                caption: 'Red Berries' },
  { src: '/Remastered Photos/Catail.jpg',                                   caption: 'Cattail' },
  { src: '/Remastered Photos/Big Tree.jpg',                                 caption: 'Big Tree' },
  { src: '/Remastered Photos/Mac Johnston Reservoir.jpg',                   caption: 'Mac Johnston Reservoir' },
  { src: '/Remastered Photos/St. Lawerence River with Blue Sky Clouds.jpg', caption: 'St. Lawrence River, Blue Sky' },
  { src: '/Remastered Photos/Blue Sky Clouds.jpg',                          caption: 'Blue Sky Clouds' },
  { src: '/Remastered Photos/Plane in Blue Sky.jpg',                        caption: 'Plane in Blue Sky' },
]

const MIN_SCALE = 1
const MAX_SCALE = 5

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ idx, onClose, onGo }) {
  const photo    = PHOTOS[idx]
  const canPrev  = idx > 0
  const canNext  = idx < PHOTOS.length - 1

  const scaleRef      = useRef(1)
  const offsetRef     = useRef({ x: 0, y: 0 })
  const draggingRef   = useRef(false)
  const dragStartRef  = useRef(null)
  const touchStartRef = useRef(null)
  const imgRef        = useRef(null)
  const containerRef  = useRef(null)
  const wrapperRef    = useRef(null)

  const [scale,       setScale]       = useState(1)
  const [dragging,    setDragging]    = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hiResSrc,    setHiResSrc]    = useState(null)
  const [hiResFailed, setHiResFailed] = useState(false)

  // Paint the grid thumbnail immediately -- it is already in cache, so the
  // lightbox never opens empty -- while the full-resolution original decodes
  // off-screen. Swap only once it is ready, so there is no half-drawn image.
  useEffect(() => {
    let cancelled = false
    setHiResSrc(null)
    setHiResFailed(false)

    const full = fullResSrc(photo.src)
    const img = new Image()
    img.decoding = 'async'
    img.onload  = () => { if (!cancelled) setHiResSrc(full) }
    img.onerror = () => { if (!cancelled) setHiResFailed(true) }   // keep the thumbnail
    img.src = full
    if (img.complete && img.naturalWidth) setHiResSrc(full)        // already cached

    return () => { cancelled = true; img.onload = null; img.onerror = null }
  }, [photo.src])

  const displaySrc = hiResSrc ?? thumbSrc(photo.src)
  const hiResPending = !hiResSrc && !hiResFailed

  const applyTransform = useCallback((s, ox, oy) => {
    if (imgRef.current) {
      imgRef.current.style.transform = `scale(${s}) translate(${ox}px, ${oy}px)`
    }
  }, [])

  // Reset zoom on photo change
  useEffect(() => {
    scaleRef.current = 1
    offsetRef.current = { x: 0, y: 0 }
    applyTransform(1, 0, 0)
    setScale(1)
  }, [idx, applyTransform])

  // Keyboard: ←/→ nav, Esc close
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft'  && canPrev) onGo(idx - 1)
      if (e.key === 'ArrowRight' && canNext) onGo(idx + 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, onGo, idx, canPrev, canNext])

  // Scroll-to-zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const h = (e) => {
      e.preventDefault()
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
        +(scaleRef.current + (e.deltaY > 0 ? -0.3 : 0.3)).toFixed(2)))
      scaleRef.current = next
      if (next <= MIN_SCALE) offsetRef.current = { x: 0, y: 0 }
      applyTransform(next, offsetRef.current.x, offsetRef.current.y)
      setScale(next)
    }
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  }, [applyTransform])

  // Fullscreen change listener
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) wrapperRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  // Mouse drag
  const handleMouseDown = useCallback((e) => {
    if (scaleRef.current <= MIN_SCALE) return
    e.preventDefault()
    draggingRef.current = true
    setDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!draggingRef.current || !dragStartRef.current) return
    const ox = dragStartRef.current.ox + (e.clientX - dragStartRef.current.x) / scaleRef.current
    const oy = dragStartRef.current.oy + (e.clientY - dragStartRef.current.y) / scaleRef.current
    offsetRef.current = { x: ox, y: oy }
    applyTransform(scaleRef.current, ox, oy)
  }, [applyTransform])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
    setDragging(false)
    dragStartRef.current = null
  }, [])

  // Touch swipe for prev/next (only when not zoomed)
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current
    touchStartRef.current = null
    if (scaleRef.current > MIN_SCALE) return
    if (dx < -50 && canNext) onGo(idx + 1)
    if (dx >  50 && canPrev) onGo(idx - 1)
  }

  const zoomBy = (delta) => {
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(scaleRef.current + delta).toFixed(2)))
    scaleRef.current = next
    if (next <= MIN_SCALE) offsetRef.current = { x: 0, y: 0 }
    applyTransform(next, offsetRef.current.x, offsetRef.current.y)
    setScale(next)
  }

  const reset = () => {
    scaleRef.current = 1
    offsetRef.current = { x: 0, y: 0 }
    applyTransform(1, 0, 0)
    setScale(1)
  }

  return createPortal(
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'var(--display-bg)' }}
    >
      {/* The viewer is dark in both themes, like a monitor bezel, so its text
          uses the display tokens and its controls are ordinary keys. The
          photograph itself is shown untouched. */}
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgb(var(--display-phosphor-rgb) / 0.18)', background: 'var(--display-raised)' }}
      >
        <div className="min-w-0">
          <p className="font-mono-data text-xs truncate" style={{ color: 'var(--display-text)' }}>
            {photo.caption}
          </p>
          <p className="font-mono-data mt-0.5" style={{ color: 'var(--display-dim)', fontSize: '0.875rem' }}>
            {idx + 1} / {PHOTOS.length}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="key key-sm"
          >
            <span aria-hidden="true" className="material-symbols-rounded text-base">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="key key-sm"
          >
            <span aria-hidden="true" className="material-symbols-rounded text-base">close</span>
          </button>
        </div>
      </div>

      {/* ── Image canvas ── */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden flex items-center justify-center select-none"
        style={{ cursor: dragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={displaySrc}
          alt={photo.caption}
          draggable={false}
          decoding="async"
          onContextMenu={(e) => e.preventDefault()}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: 'scale(1) translate(0px, 0px)',
            transformOrigin: 'center center',
            transition: 'none',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        />

        {/* ── Full-resolution loading chip ── */}
        {hiResPending && (
          <div
            className="absolute top-4 left-4 flex items-center gap-2 font-mono-data text-xs px-2.5 py-1.5 pointer-events-none"
            style={{ background: 'var(--display-raised)', border: '1px solid #000', borderRadius: 'var(--radius-control)', color: 'var(--display-dim)' }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-rounded animate-spin"
              style={{ fontSize: '0.95rem', color: 'var(--display-phosphor)' }}
            >
              progress_activity
            </span>
            Loading full resolution…
          </div>
        )}

        {/* ── Prev arrow ── */}
        {canPrev && (
          <button
            onClick={() => onGo(idx - 1)}
            aria-label="Previous photo"
            className="key absolute left-4 top-1/2 -translate-y-1/2"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">chevron_left</span>
          </button>
        )}

        {/* ── Next arrow ── */}
        {canNext && (
          <button
            onClick={() => onGo(idx + 1)}
            aria-label="Next photo"
            className="key absolute right-16 top-1/2 -translate-y-1/2"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">chevron_right</span>
          </button>
        )}

        {/* ── Zoom controls (vertical key group, bottom-right) ── */}
        <div
          className="absolute right-4 bottom-4 flex flex-col gap-1 p-1"
          style={{ background: 'var(--display-raised)', border: '1px solid #000', borderRadius: 'var(--radius-control)' }}
        >
          <button
            onClick={() => zoomBy(0.5)}
            disabled={scale >= MAX_SCALE}
            className="key"
            style={{ width: 36, height: 36, padding: 0, opacity: scale >= MAX_SCALE ? 0.45 : 1 }}
            aria-label="Zoom in"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>add</span>
          </button>

          <button
            onClick={() => zoomBy(-0.5)}
            disabled={scale <= MIN_SCALE}
            className="key"
            style={{ width: 36, height: 36, padding: 0, opacity: scale <= MIN_SCALE ? 0.45 : 1 }}
            aria-label="Zoom out"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>remove</span>
          </button>

          <button
            onClick={reset}
            className="key"
            style={{ width: 36, height: 36, padding: 0 }}
            aria-label="Fit to screen"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>fit_screen</span>
          </button>
        </div>

        {/* Scale readout */}
        {scale > 1 && (
          <div className="display readout absolute left-4 bottom-4 text-xs px-2 py-1">
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>

      {/* Caption bar: a solid strip below the picture. It used to sit over the
          bottom of the photograph on a gradient. */}
      <div
        className="flex items-end justify-between px-5 py-3 shrink-0"
        style={{ borderTop: '1px solid rgb(var(--display-phosphor-rgb) / 0.18)', background: 'var(--display-raised)' }}
      >
        <p className="font-sans text-sm" style={{ color: 'var(--display-text)' }}>
          {photo.caption}
        </p>
        <p className="font-mono-data text-xs" style={{ color: 'var(--display-dim)' }}>
          © Nic Piraino
        </p>
      </div>
    </div>,
    document.body
  )
}

// ─── Uniform grid item ────────────────────────────────────────────────────────
// Every tile is a fixed 4:3 box so the grid lines up in exact rows and columns.
// This replaced a masonry layout: masonry keeps each photo's own proportions, so
// the columns necessarily end at different heights and never line up -- which read
// as "not in line". All 94 gallery photos are landscape -- 56 at 4:3, 36 at 3:2
// and 2 just under 4:3 -- so a 4:3 tile fits the majority exactly and only mildly
// centre-crops the 3:2 ones via object-cover. The lightbox still loads the full,
// uncropped image on click.
/* No scroll-entrance animation. 94 tiles staggering in eight at a time is the
   single most template-looking thing the gallery did, and it made the grid feel
   like a slideshow being played at you rather than a wall of photographs you
   are looking through. The images already fade as they decode, which is a real
   event; the tile itself just exists. */
function PhotoTile({ photo, flatIdx, onOpen }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      type="button"
      aria-label={`Open ${photo.title || photo.alt || 'photograph'} full size`}
      className="img-hover-scale group relative overflow-hidden rounded cursor-pointer text-left w-full"
      onClick={() => onOpen(flatIdx)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ aspectRatio: '4 / 3', border: '1px solid var(--seam)' }}
    >
      <Picture
        src={thumbSrc(photo.src)}
        alt={photo.caption}
        className="w-full h-full object-cover block"
        /* No colour filter. These are photographs of real objects and places,
           shown as captured; the instrument styling lives in the frame around
           them, never in a grade applied on top. */
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: 'var(--panel-recessed)' }}
        />
      )}
      <div
        className="hover-caption absolute inset-x-0 bottom-0 px-3 py-2"
        style={{ background: 'var(--display-bg)', borderTop: '1px solid #000' }}
      >
        {/* 0.75rem (12px) floor: the old 0.68rem bottomed out at 10.9px on
            phones, where these captions are permanently visible (the
            hover-reveal is overridden under `@media (hover: none)`). */}
        <p className="font-sans text-xs" style={{ color: 'var(--display-text)', fontSize: 'clamp(0.75rem, 0.68rem + 0.2vw, 0.8rem)' }}>
          {photo.caption}
        </p>
      </div>
    </button>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
// This was /photography, a route of its own. It is now a tab on /hobbies, so it
// no longer owns the page <h1> or the document title -- HobbiesPage does. The
// heading here is an <h2> to keep the outline valid under that page's <h1>.
export default function PhotoGallery() {
  const [lightboxIdx, setLightboxIdx] = useState(-1)

  return (
    <section className="px-5 pt-2 pb-20 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      {/* Header */}
      <h2 className="sr-only">Photography</h2>
      <p
        className="legend mb-4 legend-module"
      >
        Kelowna · Ottawa · Brockville
      </p>
      <p
        className="font-sans mb-8 max-w-lg"
        style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.75 }}
      >
        Landscapes, wildlife, and urban scenes from across British Columbia and Eastern Ontario.
      </p>

      {/* Copyright notice */}
      <div
        className="panel-recessed inline-flex items-center gap-2 font-mono-data text-xs px-4 py-2 mb-14"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--text-muted)' }}>copyright</span>
        All photographs by Nic Piraino. No use, reproduction, or distribution without explicit written permission.
      </div>

      {/* Uniform grid. Every tile is a fixed 4:3 box (see PhotoTile), so rows
          and columns line up exactly at every breakpoint -- 2 columns on mobile,
          up to 4 on wide screens. This replaced a masonry layout whose columns
          kept each photo's own height and therefore never ended level. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {PHOTOS.map((photo, i) => (
          <PhotoTile key={photo.src} photo={photo} flatIdx={i} onOpen={setLightboxIdx} />
        ))}
      </div>

        {lightboxIdx >= 0 && (
          <Lightbox
            idx={lightboxIdx}
            onClose={() => setLightboxIdx(-1)}
            onGo={setLightboxIdx}
          />
        )}

    </section>
  )
}
