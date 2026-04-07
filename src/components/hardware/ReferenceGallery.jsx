import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useAppStore } from '../../store/useAppStore'

// â”€â”€â”€ Image manifest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Files confirmed in /public/ (all .png)
export const REFERENCE_IMAGES = [
  {
    src:     '/Screenshot 2026-03-31 125242.png',
    label:   '3D Assembly View',
    caption: 'Top-side component render â€” Heartbeat Hotel Rev. A',
    view:    'isometric',
  },
  {
    src:     '/Screenshot 2026-03-31 125305.png',
    label:   'Bottom Trace',
    caption: 'Rear copper layer â€” trace routing and via connections',
    view:    'bottom',
  },
]

// â”€â”€â”€ Lightbox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Lightbox({ image, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-6"
      style={{ background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1,    y: 0  }}
        exit={{ scale: 0.92,    y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative max-w-5xl w-full"
      >
        <img
          src={image.src}
          alt={image.label}
          className="w-full rounded-xl border-subtle"
          style={{ maxHeight: '82vh', objectFit: 'contain', background: '#0d1f0f', filter: 'brightness(3.5) contrast(1.6) saturate(2)', mixBlendMode: 'screen' }}
        />
        {/* Caption bar */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>{image.label}</p>
            <p className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{image.caption}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 font-mono-data text-sm px-3 py-2 rounded-lg border-subtle"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">close</span>ESC
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// â”€â”€â”€ Gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ReferenceGallery({ onSyncView }) {
  const [lightbox, setLightbox] = useState(null)

  const rawIndex       = useAppStore((s) => s.galleryIndex)
  const setActiveIndex = useAppStore((s) => s.setGalleryIndex)
  const activeIndex    = Math.min(rawIndex, REFERENCE_IMAGES.length - 1)

  function handleClick(img, idx) {
    setActiveIndex(idx)
    // Sync the 3D camera if this image has a view preset
    if (img.view && onSyncView) onSyncView(img.view)
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-surface-1)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-mono-data text-sm tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Engineering Refs
        </p>
        <p className="font-mono-data text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Click to sync 3D view
        </p>
      </div>

      {/* Thumbnail strip */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1">
        {REFERENCE_IMAGES.map((img, i) => (
          <motion.div
            key={img.src}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="relative group cursor-pointer rounded-lg overflow-hidden border"
            style={{
              borderColor: i === activeIndex ? 'var(--accent)' : 'var(--border)',
              boxShadow: i === activeIndex ? '0 0 0 1px var(--accent)' : 'none',
              aspectRatio: '16/9',
              background: '#003a4a',
            }}
            onClick={() => handleClick(img, i)}
          >
            <img
              src={img.src}
              alt={img.label}
              className="w-full h-full object-cover transition-all duration-200"
              style={{
                filter: 'brightness(4.5) contrast(1.8) saturate(3) hue-rotate(160deg)',
                mixBlendMode: 'screen',
              }}
            />

            {/* Hover overlay â€” zoom icon */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'rgba(3,7,18,0.45)' }}
              onClick={(e) => { e.stopPropagation(); setLightbox(img) }}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-2xl" style={{ color: 'var(--accent)' }}>zoom_in</span>
            </div>

            {/* Label */}
            <div
              className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: 'linear-gradient(transparent, rgba(3,7,18,0.70))' }}
            >
              <p className="font-mono-data text-sm" style={{ color: '#ffffff' }}>{img.label}</p>
            </div>

            {/* Active indicator */}
            {i === activeIndex && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="font-mono-data text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(6,95,70,0.7)', color: 'var(--accent)' }}>
                  ACTIVE
                </span>
              </div>
            )}

            {/* Sync badge */}
            {img.view && (
              <div className="absolute top-2 left-2">
                <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  sync
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Caption for active image */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="font-mono-data text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {REFERENCE_IMAGES[activeIndex].label}
        </p>
        <p className="font-mono-data text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {REFERENCE_IMAGES[activeIndex].caption}
        </p>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  )
}
