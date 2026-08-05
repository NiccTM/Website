import { useState, useEffect, useRef } from 'react'
import { archiveData } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc } from '../../utils/thumbs'
import { gridColsFor } from '../../utils/gridCols'
import Picture from '../ui/Picture'

// ─── Data-decode scramble ─────────────────────────────────────────────────────
const SCRAMBLE_CHARS = '0123456789ABCDEF#&%$@!?<>[]{}|'
function useScramble(text, active) {
  const [display, setDisplay] = useState(text)
  const timerRef = useRef(null)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!active) { setDisplay(text); return }
    const total = 300 / 16
    let frame = 0
    timerRef.current = setInterval(() => {
      frame++
      const progress = frame / total
      if (progress >= 1) { setDisplay(text); clearInterval(timerRef.current); return }
      const resolved = Math.floor(progress * text.length)
      setDisplay(text.split('').map((ch, i) => {
        if (ch === ' ') return ' '
        if (i < resolved) return ch
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      }).join(''))
    }, 16)
    return () => clearInterval(timerRef.current)
  }, [active, text])
  return display
}

// ─── Image card ───────────────────────────────────────────────────────────────
function ArchiveImage({ image, index }) {
  const [hovered,  setHovered]  = useState(false)
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => setLightbox(true)}
        className="relative overflow-hidden cursor-zoom-in"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgb(var(--accent-rgb) / 0.14)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius)',
          aspectRatio: '4/3',
        }}
      >
        <Picture
          src={thumbSrc(image.src)}
          loading="lazy"
          decoding="async"
          alt={image.label}
          className="w-full h-full object-cover transition-all duration-500"
          /* objectPosition top: several of these are PORTRAIT photos (the hi-fi
             rack, the headphone, the GPU) shown in a 4:3 landscape box. Centred
             cover-cropping sliced out the vertical middle -- for the rack that
             meant a band of bare shelf with the turntable cropped away, which
             read as if the photo were rotated. Anchoring to the top keeps the
             subject, which in every one of these shots sits at the top. */
          style={{ objectPosition: 'top', transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.3s' }}
        />
        {/* Caption scrim. Was `inset-0` + justify-end with a gradient that is
            transparent above 75%, so on a narrow card the text block grew past
            the fade and covered nearly the whole image. Anchoring to the bottom
            edge lets the scrim hug its own text at any card size. Same fix as
            HardwareDiagnostics. */}
        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-4"
          style={{ background: 'linear-gradient(to top, rgba(3,7,18,0.97) 0%, rgba(3,7,18,0.88) 55%, rgba(3,7,18,0.55) 85%, rgba(3,7,18,0) 100%)' }}
        >
          <p className="font-mono-data text-sm font-medium line-clamp-2" style={{ color: '#ffffff' }}>{image.label}</p>
          <p className="font-mono-data mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.875rem' }}>{image.caption}</p>
        </div>
        <div className="absolute top-2 right-2 transition-opacity duration-200" style={{ opacity: hovered ? 1 : 0 }}>
          <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>zoom_in</span>
        </div>
      </div>

        {lightbox && <ImageLightbox src={image.src} label={image.label} caption={image.caption} onClose={() => setLightbox(false)} />}

    </>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ArchiveModule({ mod, moduleIndex }) {
  const [hovered, setHovered] = useState(false)
  const scrambled = useScramble(mod.title, hovered)

  return (
    <div
      className="mb-10"
    >
      {/* Module header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>{mod.icon}</span>
        <h2
          className="font-mono-data text-base tracking-widest uppercase cursor-default"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {scrambled}
        </h2>
        <div className="flex-1 h-px" style={{ background: 'rgb(var(--accent-rgb) / 0.12)' }} />
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{mod.spec}</span>
      </div>
      <p className="font-mono-data text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {mod.descriptor}
      </p>

      {/* Image grid */}
      {/* Single column under 480px. At 2 columns a phone card is ~182x136, which
          is too small for a label plus a full caption -- the scrim grew past the
          card and buried the photo entirely.
          Above that, columns are capped to the number of images, and the width
          capped with them, for the reason given over GRID_FOR_COUNT in
          HardwareDiagnostics: these modules hold one or two photos each, and a
          lone thumbnail in a four-column track reads as a grid that failed to
          fill. Both files need the same treatment because they render adjacent
          sections of the same page -- fixing only one made the mismatch worse. */}
      <div className={`grid gap-3 ${gridColsFor(mod.images.length, 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}`}>
        {mod.images.map((img, i) => (
          <ArchiveImage key={img.src} image={img} index={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ArchiveModules() {
  return (
    <section className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      {archiveData.map((mod, i) => (
        <ArchiveModule key={mod.id} mod={mod} moduleIndex={i} />
      ))}
    </section>
  )
}
