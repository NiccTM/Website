import { useState, useEffect, lazy, Suspense } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { profile, contact } from '../data/config'
import SocialLinks from '../components/ui/SocialLinks'

const AudioSignalChain   = lazy(() => import('../components/diagrams/AudioSignalChain'))
const SystemArchitecture = lazy(() => import('../components/diagrams/SystemArchitecture'))

// ─── Hero carousel photos ──────────────────────────────────────────────────────
const HERO_PHOTOS = [
  '/Remastered Photos/Northern Lights.jpg',
  '/Remastered Photos/Kelowna Night Sky.jpg',
  '/Remastered Photos/Yellow Rolling Clouds.jpg',
  '/Remastered Photos/Kelwona Blue & Orange Sky.jpg',
  '/Remastered Photos/Kelowna Mountains.jpg',
  '/Remastered Photos/Ottawa Night.jpg',
  '/Remastered Photos/Clouds from Above.jpg',
]

const TAGLINES = [
  'Hardware Engineering & System Design',
  'PCB Designer · Motor Builder · ML Engineer',
  'UBCO Rover Team · CIRC Competitor',
  'Turning theory into hardware',
]

function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % HERO_PHOTOS.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={HERO_PHOTOS[current]}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ willChange: 'opacity, transform' }}
        />
      </AnimatePresence>
      {/* Gradient fade to right on desktop — only last 20% */}
      <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(to right, transparent 80%, var(--hero-gradient-to) 100%)' }} />
      {/* Dark overlay for mobile legibility */}
      <div className="absolute inset-0 bg-black/40 md:hidden" />

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-6 flex gap-2">
        {HERO_PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Photo ${i + 1}`}
            className="transition-all duration-300"
            style={{
              width: i === current ? '24px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function RotatingTagline() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % TAGLINES.length), 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="font-sans text-lg sm:text-xl font-light"
        style={{ color: 'var(--text-secondary)' }}
      >
        {TAGLINES[idx]}
      </motion.p>
    </AnimatePresence>
  )
}

function Divider() {
  return (
    <div className="max-w-[1600px] tv:max-w-[2400px] mx-auto w-full px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      <hr style={{ borderColor: 'var(--border)' }} />
    </div>
  )
}

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <div className="h-48 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface-1)' }} />
    </div>
  )
}

export default function HomePage() {
  usePageMeta(null, 'Nic Piraino — Hardware Engineering & System Design. Embedded systems, PCB design, audio electronics, and full-stack engineering.')
  return (
    <>
      {/* ── Split-screen Hero ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col md:flex-row md:min-h-screen overflow-hidden">
        {/* Top (mobile) / Left (desktop): Photo carousel — 45vh crop on mobile, fills column on desktop */}
        <div className="relative w-full h-[45vh] md:w-[55%] md:h-auto flex-shrink-0 overflow-hidden">
          <HeroCarousel />
        </div>

        {/* Bottom (mobile) / Right (desktop): Editorial text */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="relative z-10 flex flex-col items-center md:items-start justify-center
                     text-center md:text-left
                     px-6 py-10 sm:px-10 md:py-0 md:px-14 lg:px-20 xl:px-24 tv:px-32 md:w-[45%]"
          style={{
            background: 'var(--hero-panel-bg)',
            backdropFilter: 'blur(20px) saturate(130%)',
            WebkitBackdropFilter: 'blur(20px) saturate(130%)',
            boxShadow: 'var(--hero-panel-glow)',
          }}
        >
          {/* Eyebrow */}
          <p
            className="font-mono-data tracking-[0.18em] uppercase mb-5"
            style={{ color: 'var(--accent)' }}
          >
            {profile.location} · {profile.academics.institution}
          </p>

          {/* Name — massive Playfair Display */}
          <h1
            className="font-display leading-[0.92] mb-6"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 7rem)',
              color: 'var(--text-primary)',
              fontWeight: 900,
            }}
          >
            Nic<br />
            <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Piraino</span>
          </h1>

          {/* Rotating tagline */}
          <div style={{ minHeight: '2rem' }} className="mb-6">
            <RotatingTagline />
          </div>

          {/* Team pills */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
            {profile.academics.teams.map((team) => (
              <span
                key={team}
                className="font-mono-data px-3 py-1 rounded-full text-xs"
                style={{
                  color: 'var(--accent)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  background: 'rgba(0,229,255,0.06)',
                }}
              >
                {team}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
            <Link
              to="/projects"
              className="btn-primary font-sans text-sm px-6 py-2.5"
            >
              View Projects
            </Link>
            <Link
              to="/photography"
              className="btn-outline font-sans text-sm px-6 py-2.5"
            >
              Photography
            </Link>
          </div>

          <SocialLinks />
        </motion.div>
      </section>

      {/* ── Diagrams ────────────────────────────────────────────────────────── */}
      <Divider />

      <Suspense fallback={<SectionFallback />}>
        <AudioSignalChain sectionId="section-audio" />
      </Suspense>

      <Divider />

      <Suspense fallback={<SectionFallback />}>
        <SystemArchitecture />
      </Suspense>

      <div className="h-12" />
    </>
  )
}
