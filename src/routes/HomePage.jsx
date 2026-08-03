import { useState, useEffect } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { profile, bio } from '../data/config'
import SocialLinks from '../components/ui/SocialLinks'
import { thumbSrc, displaySrc } from '../utils/thumbs'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

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


function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  // WCAG 2.2.2 Pause, Stop, Hide is Level A: content that starts moving on its
  // own, runs past five seconds and sits alongside other content needs a way to
  // stop it. This carousel had none. It now stops on request, and does not
  // start at all when the OS asks for reduced motion -- the CSS reduced-motion
  // block cannot help here, since this is a timer swapping state, not an
  // animation.
  const stopped = paused || reducedMotion

  useEffect(() => {
    if (stopped) return
    const id = setInterval(() => setCurrent((c) => (c + 1) % HERO_PHOTOS.length), 5000)
    return () => clearInterval(id)
  }, [stopped])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          /* The hero was serving the 4000px display tier to everyone. It
             renders about 55vw wide, so on a 1440px laptop that is a 1,614 KB
             file doing the job of a 28 KB one, and it was the LCP element:
             3.57s measured at 5 Mbps / 4x CPU, against a 2.5s budget.

             src is the THUMB, not the display tier, and that matters more than
             the srcset does. This element is built by JS, so the moment React
             sets src the browser starts fetching it; the candidate list is
             then applied to a request already in flight and Chrome keeps what
             it has. Declaring srcSet first did not change that -- measured,
             currentSrc still resolved to display/ and 1,614 KB still went over
             the wire. Proven by building the same srcset on a page with
             nothing cached, where the browser correctly chose the 28 KB thumb.
             So src carries the cheap tier: if it is fetched eagerly it costs
             28 KB, and srcset can still upgrade to 4000w on a display that
             genuinely needs it.

             fetchpriority lifts the first slide, which is the only one that
             can ever be the LCP candidate. */
          srcSet={`${thumbSrc(HERO_PHOTOS[current])} 800w, ${displaySrc(HERO_PHOTOS[current])} 4000w`}
          sizes="(max-width: 767px) 100vw, 55vw"
          fetchpriority={current === 0 ? 'high' : 'auto'}
          src={thumbSrc(HERO_PHOTOS[current])}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ willChange: 'opacity, transform' }}
        />
      </AnimatePresence>
      {/* Gradient fade to right on desktop -- only last 20% */}
      <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(to right, transparent 80%, var(--hero-gradient-to) 100%)' }} />
      {/* Light scrim so the dot indicators keep contrast against the photo.
          This was bg-black/40 "for mobile legibility", but on mobile the layout
          stacks (flex-col): the text sits BELOW the photo, never over it. At 40%
          over night photography the hero rendered as a near-black rectangle. */}
      <div className="absolute inset-0 bg-black/15 md:hidden" />

      {/* Dot indicators. The visible dot stays 6px, but each button carries a
          24x24 hit area -- WCAG 2.2 AA 2.5.8 (Target Size Minimum) sets 24x24
          CSS px as the floor, and a 6x6 tap target is genuinely hard to hit. */}
      <div className="absolute bottom-4 left-4 flex items-center">
        {/* Pause/resume -- the WCAG 2.2.2 mechanism. Hidden when the OS already
            asks for reduced motion, since nothing is moving to pause. */}
        {!reducedMotion && (
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume photo slideshow' : 'Pause photo slideshow'}
            className="grid place-items-center mr-1"
            style={{ width: '28px', height: '28px', color: 'rgba(255,255,255,0.8)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '1.05rem' }}>
              {paused ? 'play_arrow' : 'pause'}
            </span>
          </button>
        )}
        {HERO_PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show photo ${i + 1} of ${HERO_PHOTOS.length}`}
            aria-current={i === current ? 'true' : undefined}
            className="grid place-items-center"
            style={{ width: '28px', height: '28px' }}
          >
            <span
              aria-hidden="true"
              className="block transition-all duration-300"
              style={{
                width: i === current ? '24px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="max-w-[1600px] tv:max-w-[2400px] mx-auto w-full px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      <hr style={{ borderColor: 'var(--border)' }} />
    </div>
  )
}

/* Sits directly under the hero so the first thing below the fold is the
   engineering, not a hobby. Every field comes from `profile` in config.js or
   from work that has its own page -- nothing here is invented, and there are no
   titles or dates I cannot support. */
const ABOUT_FACTS = [
  { label: 'Studying', value: `${bio.program}, ${bio.school}` },
  { label: 'Currently', value: `${bio.role}, ${bio.employer}`, to: '/hardware/reference' },
  { label: 'Team',     value: profile.academics.teams.join(' · ') },
  { label: 'Based in', value: profile.location },
]

function About() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
      aria-labelledby="about-heading"
      /* This section once needed [&_p]:max-w-none to escape a global
         `p { max-width: 72ch }`, which stopped the prose ~280px short of its
         grid column and left a conspicuous gap before the facts panel. That
         rule is opt-in now, so the grid alone controls the width. */
      className="relative z-10 px-5 py-12 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      <h2
        id="about-heading"
        className="font-mono-data text-base tracking-widest uppercase mb-5"
        style={{ color: 'var(--accent)' }}
      >
        About
      </h2>

      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start">
        <div>
          <p className="font-sans mb-4" style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.75 }}>
            I build hardware that has to answer to an instrument: precision analog, PCB design,
            embedded systems and electrical metrology.
          </p>
          <p className="font-sans mb-4" style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8 }}>
            A schematic predicts what a circuit should do and a simulation models it, but the part
            I care about starts once the board exists and has to demonstrate what it actually
            does. A three-phase motor wound from scratch. A waste classifier that had to work on
            real rubbish rather than a curated demo. A 10&nbsp;V reference where the whole point is
            how little it moves.
          </p>
          <p className="font-sans" style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8 }}>
            The write-ups here separate what was <em>calculated</em> from what was{' '}
            <em>simulated</em> and what was actually <em>measured</em>. They are three different
            claims, and running them together is how a project ends up sounding better than it is.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              to="/about"
              className="font-mono-data text-sm px-4 py-2 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--bg-base)', background: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              More about me
            </Link>
            <Link
              to="/projects"
              className="font-mono-data text-sm px-4 py-2 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--accent)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            >
              View projects
            </Link>
            <Link
              to="/hardware"
              className="font-mono-data text-sm px-4 py-2 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            >
              Hardware lab
            </Link>
          </div>
        </div>

        <dl
          className="rounded-xl overflow-hidden w-full"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface-1)' }}
        >
          {ABOUT_FACTS.map(({ label, value, to }, i) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 px-4 py-3"
              style={{ borderBottom: i < ABOUT_FACTS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <dt className="font-mono-data text-sm shrink-0 sm:w-28" style={{ color: 'var(--text-muted)' }}>
                {label}
              </dt>
              <dd className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>
                {to ? (
                  <Link to={to} style={{ color: 'var(--accent)' }}>{value}</Link>
                ) : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.section>
  )
}

export default function HomePage() {
  usePageMeta(null, 'Nic Piraino: Hardware Engineering & System Design. Embedded systems, PCB design, audio electronics, and full-stack engineering.')
  return (
    <>
      {/* ── Split-screen Hero ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col md:flex-row md:min-h-screen overflow-hidden">
        {/* Top (mobile) / Left (desktop): Photo carousel -- 45vh crop on mobile, fills column on desktop */}
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

          {/* Name -- massive Playfair Display */}
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

          {/* One fixed line, and no pills under it. The tagline cycled through
              four phrases while the pills directly beneath repeated one of
              them, so the hero said "Okanagan Rover Craft, CIRC Competitor"
              twice in two shapes at once. Auto-cycling text is also a close
              relative of the scrolling ticker bar generated sites lean on. One
              true sentence about what I currently do beats four rotating ones,
              and the teams are still listed in the About panel below. */}
          <p
            className="font-sans text-lg sm:text-xl font-light mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {bio.role}, {bio.employer}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
            <Link
              to="/projects"
              className="btn-primary font-sans text-sm px-6 py-2.5"
            >
              View Projects
            </Link>
            <Link
              to="/hobbies?tab=photography"
              className="btn-outline font-sans text-sm px-6 py-2.5"
            >
              Photography
            </Link>
          </div>

          <SocialLinks />
        </motion.div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <Divider />

      <About />

      <div className="h-12" />
    </>
  )
}
