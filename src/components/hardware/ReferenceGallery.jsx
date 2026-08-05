import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../../store/useAppStore'
import { thumbSrc, displaySrc } from '../../utils/thumbs'
import Picture from '../ui/Picture'

// ─── Image manifest ───────────────────────────────────────────────────────────
// Files confirmed in /public/ (all .png)
export const REFERENCE_IMAGES = [
  {
    src:     '/Screenshot 2026-03-31 125242.jpg',
    label:   '3D Assembly View',
    caption: 'Top-side component render · Heartbeat Hotel Rev. A',
    view:    'isometric',
  },
  {
    src:     '/Screenshot 2026-03-31 125305.jpg',
    label:   'Bottom Trace',
    caption: 'Rear copper layer · trace routing and via connections',
    view:    'bottom',
  },
]

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ image, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      key="lightbox"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-6"
      style={{ background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative max-w-5xl w-full"
      >
        <img
          src={displaySrc(image.src)}
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
      </div>
    </div>,
    document.body
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
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
          /* Two sibling buttons. The zoom overlay was inset-0 with its own
             onClick, and opacity: 0 still takes pointer events -- so it covered
             the tile and swallowed every click, leaving the sync action
             unreachable by mouse. Same fix as HardwarePage's strip. */
          <div
            key={img.src}
            className="tile-lift relative group rounded-lg overflow-hidden border"
            style={{
              borderColor: i === activeIndex ? 'var(--accent)' : 'var(--border)',
              boxShadow: i === activeIndex ? '0 0 0 1px var(--accent)' : 'none',
              aspectRatio: '16/9',
              background: '#003a4a',
            }}
          >
            <button
              type="button"
              onClick={() => handleClick(img, i)}
              aria-label={`Sync the 3D view to ${img.label}`}
              aria-pressed={i === activeIndex}
              className="block w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2"
              style={{ '--tw-ring-color': 'var(--accent)' }}
            >
            <Picture
              src={thumbSrc(img.src)}
              /* alt="" on purpose: the label is rendered as visible text in
                 the gradient below, and the button wrapping this image already
                 names the action. A non-empty alt here makes a screen reader
                 announce the same words twice (axe: image-redundant-alt). */
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-all duration-200"
              style={{
                filter: 'brightness(4.5) contrast(1.8) saturate(3) hue-rotate(160deg)',
                mixBlendMode: 'screen',
              }}
            />

            {/* Label */}
            <div
              className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              /* Plate rather than gradient: a gradient only reaches full
                 strength at its bottom edge, so the text sat on whatever partial
                 tint the photograph put behind it. See HardwarePage. */
              style={{ background: 'rgba(3,7,18,0.82)' }}
            >
              <p className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.95)' }}>{img.label}</p>
            </div>

            {/* Active indicator */}
            {i === activeIndex && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {/* --accent-on-dark: dark green plate in both themes. */}
                <span className="font-mono-data text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(6,95,70,0.85)', color: 'var(--accent-on-dark)' }}>
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
            </button>

            {/* Zoom, its own control in the corner rather than an invisible
                sheet over the tile. Bottom-left clears the ACTIVE badge. */}
            <button
              type="button"
              onClick={() => setLightbox(img)}
              aria-label={`Open ${img.label} full size`}
              className="absolute bottom-2 left-2 grid place-items-center w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 focus:outline-none focus-visible:ring-2"
              style={{
                background: 'rgba(3,7,18,0.72)',
                border: '1px solid rgb(var(--accent-rgb) / 0.35)',
                '--tw-ring-color': 'var(--accent)',
              }}
            >
              <span aria-hidden="true" className="material-symbols-rounded text-base" style={{ color: 'var(--accent-on-dark)' }}>zoom_in</span>
            </button>
          </div>
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

        {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}

    </div>
  )
}
