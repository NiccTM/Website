import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { archiveData } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'

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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-24px' }}
        transition={{ duration: 0.35, delay: index * 0.07 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => setLightbox(true)}
        className="relative overflow-hidden cursor-zoom-in"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,229,255,0.14)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
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
          style={{ background: 'linear-gradient(to top, rgba(3,7,18,0.97) 0%, rgba(3,7,18,0.55) 50%, transparent 75%)' }}
        >
          <p className="font-mono-data text-sm font-medium" style={{ color: '#ffffff' }}>{image.label}</p>
          <p className="font-mono-data mt-0.5" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>{image.caption}</p>
        </div>
        <div className="absolute top-2 right-2 transition-opacity duration-200" style={{ opacity: hovered ? 1 : 0 }}>
          <span className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>zoom_in</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox && <ImageLightbox src={image.src} label={image.label} caption={image.caption} onClose={() => setLightbox(false)} />}
      </AnimatePresence>
    </>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ArchiveModule({ mod, moduleIndex }) {
  const [hovered, setHovered] = useState(false)
  const scrambled = useScramble(mod.title, hovered)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.38, delay: moduleIndex * 0.08 }}
      className="mb-10"
    >
      {/* Module header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>{mod.icon}</span>
        <h2
          className="font-mono-data text-base tracking-widest uppercase cursor-default"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {scrambled}
        </h2>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,229,255,0.12)' }} />
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{mod.spec}</span>
      </div>
      <p className="font-mono-data text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {mod.descriptor}
      </p>

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {mod.images.map((img, i) => (
          <ArchiveImage key={img.src} image={img} index={i} />
        ))}
      </div>
    </motion.div>
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
