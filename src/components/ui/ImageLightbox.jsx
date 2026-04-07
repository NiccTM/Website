import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

const MIN_SCALE = 1
const MAX_SCALE = 5

export default function ImageLightbox({ src, label, caption, onClose }) {
  const [scale,    setScale]    = useState(1)
  const [dragging, setDragging] = useState(false)

  // Refs — single source of truth for transform; no React state updates during drag
  const scaleRef     = useRef(1)
  const offsetRef    = useRef({ x: 0, y: 0 })
  const draggingRef  = useRef(false)
  const dragStart    = useRef(null)
  const containerRef = useRef(null)
  const imgRef       = useRef(null)

  // Write transform directly to DOM — zero React overhead
  const applyTransform = useCallback((s, ox, oy) => {
    if (imgRef.current) {
      imgRef.current.style.transform = `scale(${s}) translate(${ox}px, ${oy}px)`
    }
  }, [])

  // Sync scale state → DOM + reset offset when back to 1Ã—
  useEffect(() => {
    scaleRef.current = scale
    if (scale <= MIN_SCALE) offsetRef.current = { x: 0, y: 0 }
    applyTransform(scale, offsetRef.current.x, offsetRef.current.y)
  }, [scale, applyTransform])

  // Escape key
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Scroll-to-zoom — fully imperative, no setState during wheel
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
      setScale(next) // badge + button states only
    }
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  }, [applyTransform])

  const handleMouseDown = useCallback((e) => {
    if (scaleRef.current <= MIN_SCALE) return
    e.preventDefault()
    draggingRef.current = true
    setDragging(true)
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      ox: offsetRef.current.x, oy: offsetRef.current.y,
    }
  }, [])

  // Drag: update ref + DOM directly, never touch React state
  const handleMouseMove = useCallback((e) => {
    if (!draggingRef.current || !dragStart.current) return
    const ox = dragStart.current.ox + (e.clientX - dragStart.current.x) / scaleRef.current
    const oy = dragStart.current.oy + (e.clientY - dragStart.current.y) / scaleRef.current
    offsetRef.current = { x: ox, y: oy }
    applyTransform(scaleRef.current, ox, oy)
  }, [applyTransform])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
    setDragging(false)
    dragStart.current = null
  }, [])

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(3,7,18,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', willChange: 'opacity' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,8,18,0.98)' }}
      >
        <div className="min-w-0">
          <p className="font-mono-data text-sm font-medium truncate" style={{ color: '#ede8ff' }}>{label}</p>
          {caption && (
            <p className="font-mono-data text-sm truncate mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{caption}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 ml-4 shrink-0"
          style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
          aria-label="Close"
        >
          <span aria-hidden="true" className="material-symbols-rounded text-base">close</span>
        </button>
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
      >
        <img
          ref={imgRef}
          src={src}
          alt={label}
          draggable={false}
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

        {/* ── Floating vertical button group ── */}
        <div
          className="absolute right-4 bottom-4 flex flex-col overflow-hidden"
          style={{ background: '#17100a', border: '1px solid #281c10', borderRadius: 'var(--radius)' }}
        >
          <button
            onClick={() => zoomBy(0.5)}
            disabled={scale >= MAX_SCALE}
            className="flex items-center justify-center w-9 h-9"
            style={{ color: scale >= MAX_SCALE ? '#444' : 'var(--text-primary)' }}
            aria-label="Zoom in"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>add</span>
          </button>

          <div style={{ height: '1px', background: '#281c10' }} />

          <button
            onClick={() => zoomBy(-0.5)}
            disabled={scale <= MIN_SCALE}
            className="flex items-center justify-center w-9 h-9"
            style={{ color: scale <= MIN_SCALE ? '#444' : 'var(--text-primary)' }}
            aria-label="Zoom out"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>remove</span>
          </button>

          <div style={{ height: '1px', background: '#281c10' }} />

          <button
            onClick={reset}
            className="flex items-center justify-center w-9 h-9"
            style={{ color: scale > 1 ? '#58b8e0' : 'var(--text-muted)' }}
            aria-label="Fit to screen"
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>fit_screen</span>
          </button>
        </div>

        {/* Scale badge */}
        {scale > 1 && (
          <div
            className="absolute left-4 bottom-4 font-mono-data text-xs px-2 py-1"
            style={{ background: '#17100a', border: '1px solid #281c10', borderRadius: 'var(--radius)', color: '#58b8e0' }}
          >
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  )
}
