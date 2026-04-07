import { useState, useEffect, useRef, useCallback } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

// ─── All photos from /public/Remastered Photos/ ───────────────────────────────
const PHOTOS = [
  { src: '/Remastered Photos/Northern Lights.jpg',                    caption: 'Northern Lights' },
  { src: '/Remastered Photos/Kelowna Night Sky.jpg',                  caption: 'Kelowna Night Sky' },
  { src: '/Remastered Photos/Yellow Rolling Clouds.jpg',              caption: 'Yellow Rolling Clouds' },
  { src: '/Remastered Photos/Kelwona Blue & Orange Sky.jpg',          caption: 'Blue & Orange Sky — Kelowna' },
  { src: '/Remastered Photos/Kelwona Blue & Orange Sky Part 2.jpg',   caption: 'Blue & Orange Sky II — Kelowna' },
  { src: '/Remastered Photos/Kelowna Mountains.jpg',                  caption: 'Kelowna Mountains' },
  { src: '/Remastered Photos/Ottawa Night.jpg',                       caption: 'Ottawa Night' },
  { src: '/Remastered Photos/Clouds from Above.jpg',                  caption: 'Clouds from Above' },
  { src: '/Remastered Photos/Clouds from Airplane 1.jpg',             caption: 'Clouds from Airplane' },
  { src: '/Remastered Photos/Clouds.jpg',                             caption: 'Clouds' },
  { src: '/Remastered Photos/Kelwona Pink Sky.jpg',                   caption: 'Pink Sky — Kelowna' },
  { src: '/Remastered Photos/Kelwona Forest.jpg',                     caption: 'Forest — Kelowna' },
  { src: '/Remastered Photos/Kelowna Beach Photo 1.jpg',              caption: 'Kelowna Beach' },
  { src: '/Remastered Photos/Kelowna Boat on Water.jpg',              caption: 'Boat on Water — Kelowna' },
  { src: '/Remastered Photos/Kelowna Falls.jpg',                      caption: 'Kelowna Falls' },
  { src: '/Remastered Photos/Kelowna Helicopter.jpg',                 caption: 'Kelowna Helicopter' },
  { src: '/Remastered Photos/Kelowna Water.jpg',                      caption: 'Kelowna Water' },
  { src: '/Remastered Photos/Kelowna Waterfall.jpg',                  caption: 'Kelowna Waterfall' },
  { src: '/Remastered Photos/Kelwona Trail.jpg',                      caption: 'Trail — Kelowna' },
  { src: '/Remastered Photos/Little River Kelowna.jpg',               caption: 'Little River — Kelowna' },
  { src: '/Remastered Photos/Fox Kit Behind Pot.jpg',                 caption: 'Fox Kit' },
  { src: '/Remastered Photos/Kit Fox in Cliffside.jpg',              caption: 'Kit Fox in Cliffside' },
  { src: '/Remastered Photos/Mother Fox Looking Left.jpg',            caption: 'Mother Fox' },
  { src: '/Remastered Photos/Mother Fox on Pier.jpg',                 caption: 'Mother Fox on Pier' },
  { src: '/Remastered Photos/American Dipper.jpg',                    caption: 'American Dipper' },
  { src: '/Remastered Photos/Bee in Flower.jpg',                      caption: 'Bee in Flower' },
  { src: '/Remastered Photos/Bird on Branch Borckville.jpg',          caption: 'Bird on Branch — Brockville' },
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
  { src: '/Remastered Photos/Canadian Parliament Building 1.jpg',     caption: 'Parliament — Ottawa' },
  { src: '/Remastered Photos/Canadian Parliament Building 2.jpg',     caption: 'Parliament II — Ottawa' },
  { src: '/Remastered Photos/Canadian Parliament Building 3.jpg',     caption: 'Parliament III — Ottawa' },
  { src: '/Remastered Photos/Full View Ottawa Parliament.jpg',        caption: 'Full View — Ottawa Parliament' },
  { src: '/Remastered Photos/Ottawa Canel.jpg',                       caption: 'Ottawa Canal' },
  { src: '/Remastered Photos/Charleston Lake with Man Fishing.jpg',   caption: 'Charleston Lake' },
  { src: '/Remastered Photos/Little River Brockville.jpg',            caption: 'Little River — Brockville' },
  { src: '/Remastered Photos/Little River Brockville from Pier.jpg',  caption: 'Little River from Pier' },
  { src: '/Remastered Photos/St Lawerence Island with Cross.jpg',     caption: 'St. Lawrence — Island & Cross' },
  { src: '/Remastered Photos/St Lawerence Lily Bay.jpg',              caption: 'St. Lawrence — Lily Bay' },
  { src: '/Remastered Photos/St Lawerence River with Ship in Background.jpg', caption: 'St. Lawrence River' },
  { src: '/Remastered Photos/St Lawerence with Stanley Boat.jpg',     caption: 'St. Lawrence — Stanley Boat' },
  { src: '/Remastered Photos/Small Town from Above.jpg',              caption: 'Small Town from Above' },
  { src: '/Remastered Photos/Waterfall Chute Luke.jpg',               caption: 'Waterfall — Chute Luke' },
  { src: '/Remastered Photos/Waterfall into Pond Chute Luke.jpg',     caption: 'Waterfall into Pond' },
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

  // Keyboard: â†/→ nav, Esc close
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

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(12,8,20,0.80)',
    border: '1px solid rgba(180,140,255,0.18)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  }

  return createPortal(
    <motion.div
      ref={wrapperRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(5,4,10,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(180,140,255,0.1)', background: 'rgba(12,8,20,0.96)' }}
      >
        <div className="min-w-0">
          <p className="font-mono-data text-xs truncate" style={{ color: 'var(--text-primary)' }}>
            {photo.caption}
          </p>
          <p className="font-mono-data mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {idx + 1} / {PHOTOS.length}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            style={{ ...btnBase, width: 32, height: 32 }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-base">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ ...btnBase, width: 32, height: 32 }}
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
          src={photo.src}
          alt={photo.caption}
          draggable={false}
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

        {/* ── Prev arrow ── */}
        {canPrev && (
          <button
            onClick={() => onGo(idx - 1)}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-opacity duration-150 hover:opacity-100 opacity-60"
            style={{ ...btnBase, width: 40, height: 40, borderRadius: '50%' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">chevron_left</span>
          </button>
        )}

        {/* ── Next arrow ── */}
        {canNext && (
          <button
            onClick={() => onGo(idx + 1)}
            aria-label="Next photo"
            className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full transition-opacity duration-150 hover:opacity-100 opacity-60"
            style={{ ...btnBase, width: 40, height: 40, borderRadius: '50%' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">chevron_right</span>
          </button>
        )}

        {/* ── Zoom controls (vertical pill, bottom-right) ── */}
        <div
          className="absolute right-4 bottom-14 flex flex-col overflow-hidden"
          style={{ background: 'rgba(12,8,20,0.88)', border: '1px solid rgba(180,140,255,0.18)', borderRadius: 'var(--radius)' }}
        >
          <button
            onClick={() => zoomBy(0.5)}
            disabled={scale >= MAX_SCALE}
            className="flex items-center justify-center w-9 h-9"
            style={{ color: scale >= MAX_SCALE ? '#443355' : 'var(--text-primary)', cursor: scale >= MAX_SCALE ? 'default' : 'pointer' }}
            aria-label="Zoom in"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>add</span>
          </button>

          <div style={{ height: '1px', background: 'rgba(180,140,255,0.15)' }} />

          <button
            onClick={() => zoomBy(-0.5)}
            disabled={scale <= MIN_SCALE}
            className="flex items-center justify-center w-9 h-9"
            style={{ color: scale <= MIN_SCALE ? '#443355' : 'var(--text-primary)', cursor: scale <= MIN_SCALE ? 'default' : 'pointer' }}
            aria-label="Zoom out"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>remove</span>
          </button>

          <div style={{ height: '1px', background: 'rgba(180,140,255,0.15)' }} />

          <button
            onClick={reset}
            className="flex items-center justify-center w-9 h-9"
            style={{ color: scale > 1 ? 'var(--accent)' : '#443355', cursor: scale > 1 ? 'pointer' : 'default' }}
            aria-label="Fit to screen"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>fit_screen</span>
          </button>
        </div>

        {/* Scale badge */}
        {scale > 1 && (
          <div
            className="absolute left-4 bottom-14 font-mono-data text-xs px-2 py-1"
            style={{ background: 'rgba(12,8,20,0.88)', border: '1px solid rgba(180,140,255,0.18)', borderRadius: 'var(--radius)', color: 'var(--accent)' }}
          >
            {Math.round(scale * 100)}%
          </div>
        )}

        {/* Caption bar */}
        <div
          className="absolute bottom-0 inset-x-0 flex items-end justify-between px-5 py-4 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(5,4,10,0.88) 0%, transparent 100%)' }}
        >
          <p className="font-sans text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {photo.caption}
          </p>
          <p className="font-mono-data text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Â© Nic Piraino
          </p>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}

// ─── Masonry grid item ────────────────────────────────────────────────────────
function PhotoTile({ photo, animIndex, flatIdx, onOpen }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (animIndex % 8) * 0.04 }}
      className="img-hover-scale group relative overflow-hidden rounded-lg cursor-pointer mb-3 md:mb-4"
      onClick={() => onOpen(flatIdx)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ breakInside: 'avoid' }}
    >
      <img
        src={photo.src}
        alt={photo.caption}
        className="w-full block rounded-lg"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none', filter: 'contrast(90%) brightness(110%) saturate(110%)' }}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
      {!loaded && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{ background: 'var(--bg-surface-2)' }}
        />
      )}
      <div
        className="hover-caption absolute inset-x-0 bottom-0 px-3 py-2.5 rounded-b-lg"
        style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.45) 60%, transparent 100%)' }}
      >
        <p className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.82)', fontSize: 'clamp(0.68rem, 0.62rem + 0.2vw, 0.8rem)' }}>
          {photo.caption}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PhotographyPage() {
  usePageMeta('Photography', 'A personal photography portfolio featuring landscapes, night skies, and travel photography across Canada — captured and remastered by Nic Piraino.')
  const [lightboxIdx, setLightboxIdx] = useState(-1)

  const col1 = PHOTOS.filter((_, i) => i % 4 === 0)
  const col2 = PHOTOS.filter((_, i) => i % 4 === 1)
  const col3 = PHOTOS.filter((_, i) => i % 4 === 2)
  const col4 = PHOTOS.filter((_, i) => i % 4 === 3)

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      {/* Header */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="font-mono-data tracking-[0.18em] uppercase mb-4"
        style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
      >
        Kelowna · Ottawa · Brockville
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display mb-6"
        style={{ fontSize: 'clamp(2.75rem, 2rem + 4vw, 7rem)', fontWeight: 900, lineHeight: 0.95, color: 'var(--text-primary)' }}
      >
        Photography
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="font-sans mb-10 max-w-lg"
        style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.75 }}
      >
        Landscapes, wildlife, and urban scenes from across British Columbia and Eastern Ontario.
      </motion.p>

      {/* Copyright notice */}
      <div
        className="inline-flex items-center gap-2 font-mono-data text-xs px-4 py-2 rounded-lg mb-14"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>copyright</span>
        All photographs Â© Nic Piraino. No use, reproduction, or distribution without explicit written permission.
      </div>

      {/* Masonry grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 items-start">
        <div>
          {col1.map((photo, i) => (
            <PhotoTile key={photo.src} photo={photo} animIndex={i * 4} flatIdx={i * 4} onOpen={setLightboxIdx} />
          ))}
        </div>
        <div className="hidden sm:block">
          {col2.map((photo, i) => (
            <PhotoTile key={photo.src} photo={photo} animIndex={i * 4 + 1} flatIdx={i * 4 + 1} onOpen={setLightboxIdx} />
          ))}
        </div>
        <div className="hidden lg:block">
          {col3.map((photo, i) => (
            <PhotoTile key={photo.src} photo={photo} animIndex={i * 4 + 2} flatIdx={i * 4 + 2} onOpen={setLightboxIdx} />
          ))}
        </div>
        <div className="hidden xl:block">
          {col4.map((photo, i) => (
            <PhotoTile key={photo.src} photo={photo} animIndex={i * 4 + 3} flatIdx={i * 4 + 3} onOpen={setLightboxIdx} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIdx >= 0 && (
          <Lightbox
            idx={lightboxIdx}
            onClose={() => setLightboxIdx(-1)}
            onGo={setLightboxIdx}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
