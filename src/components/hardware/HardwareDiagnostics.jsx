import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hardwareDiagnostics } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'

// ─── Data-decode scramble (same logic as ProjectGallery) ─────────────────────
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
function DiagnosticImage({ image, index }) {
  const [hovered,  setHovered]  = useState(false)
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-24px' }}
        transition={{ duration: 0.35, delay: index * 0.06 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => setLightbox(true)}
        className="relative overflow-hidden cursor-zoom-in group"
        style={{
          background: 'rgba(255,255,255,0.22)',
          border: '1px solid rgba(255,255,255,0.45)',
          borderRadius: 'var(--radius)',
          aspectRatio: '4/3',
        }}
      >
        <img
          src={image.src}
          alt={image.label}
          className="w-full h-full object-cover transition-all duration-500"
          style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.3s' }}
        />

        {/* Always-visible gradient bar */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-3"
          style={{ background: 'linear-gradient(to top, rgba(0,20,60,0.82) 0%, rgba(0,20,60,0.45) 50%, transparent 75%)' }}
        >
          <p className="font-mono-data text-sm font-medium" style={{ color: '#ffffff' }}>{image.label}</p>
          <p className="font-mono-data mt-0.5" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>{image.caption}</p>
        </div>

        {/* Zoom icon */}
        <div
          className="absolute top-2 right-2 transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>zoom_in</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox && <ImageLightbox src={image.src} label={image.label} caption={image.caption} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  )
}

// ─── Category section ─────────────────────────────────────────────────────────
function CategorySection({ category, sectionIndex }) {
  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.28, delay: sectionIndex * 0.06 }}
        className="flex items-center gap-2 mb-4"
      >
        {category.icon === '_sacd'
          ? <span className="font-mono-data text-sm font-bold leading-none" style={{ color: 'var(--accent)', letterSpacing: '0.05em' }}>SACD</span>
          : <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>{category.icon}</span>
        }
        <span className="font-mono-data text-sm tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          {category.label}
        </span>
        <div className="flex-1 h-px ml-1" style={{ background: 'rgba(255,255,255,0.45)' }} />
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{category.description}</span>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {category.images.map((img, i) => (
          <DiagnosticImage key={img.src} image={img} index={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HardwareDiagnostics() {
  const [hovered, setHovered] = useState(false)
  const scrambled = useScramble(hardwareDiagnostics.title, hovered)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2
            className="font-mono-data text-base tracking-widest uppercase cursor-default"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {scrambled}
          </h2>
          <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            {hardwareDiagnostics.descriptor}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ background: 'rgba(58,143,204,0.08)', border: '1px solid rgba(58,143,204,0.3)', borderRadius: 'var(--radius)' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>build_circle</span>
          <span className="font-mono-data text-sm" style={{ color: 'var(--accent)' }}>{hardwareDiagnostics.spec}</span>
        </div>
      </div>

      {/* Categories */}
      {hardwareDiagnostics.categories.map((cat, i) => (
        <CategorySection key={cat.key} category={cat} sectionIndex={i} />
      ))}
    </motion.section>
  )
}
