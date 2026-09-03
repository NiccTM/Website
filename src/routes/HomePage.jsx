import { useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
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


/* The hero no longer advances on its own; the dots below it are the only way
   to change photo.

   It used to swap every five seconds, and that was the single thing keeping
   the home page from passing LCP. Every slide that painted became a fresh
   largest-contentful-paint candidate, so the metric measured the slideshow
   instead of the load: 6832ms, on a page whose first paint is 388ms and whose
   JavaScript has finished by 1216ms. Pausing the rotation was measured at
   2604ms with no image candidate at all, which is what identified the cause.

   Two things fall out of this. WCAG 2.2.2 Pause, Stop, Hide only applies to
   content that moves automatically, so the pause button is gone -- a control
   that pauses nothing is worse than no control. And the other six photos are
   no longer fetched on a timer, so a visitor who never touches the dots
   downloads exactly one hero image. */
function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  /* Which slides have ever been shown. Only these are in the DOM, so a visitor
     who never presses a dot still downloads exactly one hero image, and the
     set grows one photo at a time as they click.

     This exists because the cross-fade is now CSS rather than AnimatePresence,
     and CSS can only fade between two elements that are both present. Swapping
     src on a single <img> would cut, not fade. */
  const [shown, setShown] = useState(() => [0])
  const reducedMotion = usePrefersReducedMotion()

  function show(i) {
    setCurrent(i)
    setShown((s) => (s.includes(i) ? s : [...s, i]))
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* The first slide paints at opacity 1 with NO animation on it. That is
          not a taste decision. Chrome will not accept an element as a Largest
          Contentful Paint candidate if its first paint happens at opacity 0,
          and it does not reconsider once the opacity rises. The hero is by far
          the largest thing on this page, so fading it in from zero left
          Lighthouse with no LCP candidate at all: mobile reported NO_LCP,
          which zeroes LCP, Total Blocking Time and Time to Interactive
          together and took the Performance score to 0/100 on a page that
          renders correctly and scores 100 for Accessibility, Best Practices
          and SEO.

          Slides are stacked and cross-faded by toggling opacity, which is what
          AnimatePresence used to do. Only visited slides are mounted. */}
      {shown.map((i) => (
        <img
          key={i}
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

             fetchpriority lifts the first slide, which is now the only one
             that can be the LCP candidate at all, since nothing swaps unless
             a visitor presses a dot. */
          srcSet={`${thumbSrc(HERO_PHOTOS[i])} 800w, ${displaySrc(HERO_PHOTOS[i])} 4000w`}
          sizes="(max-width: 767px) 100vw, 55vw"
          fetchpriority={i === 0 ? 'high' : 'auto'}
          src={thumbSrc(HERO_PHOTOS[i])}
          alt=""
          aria-hidden={i === current ? undefined : 'true'}
          className="hero-slide absolute inset-0 w-full h-full object-cover"
          /* Reduced motion still applies, for a different reason than usual:
             the fade is only ever triggered by someone pressing a dot, and a
             user-initiated change should be instant if the OS asks for it. */
          style={{
            opacity: i === current ? 1 : 0,
            transitionDuration: reducedMotion ? '0ms' : '1200ms',
          }}
        />
      ))}
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
        {HERO_PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => show(i)}
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
  { label: 'Currently', value: bio.seeking },
  { label: 'Previously', value: `${bio.role}, ${bio.employer} (${bio.employerYears})`, to: '/hardware/reference' },
  { label: 'Team',     value: profile.academics.teams.join(' · ') },
  { label: 'Based in', value: profile.location },
]

function About() {
  return (
    /* This had a whileInView scroll reveal. It is gone rather than
       reimplemented: an IntersectionObserver to fade in a block of prose is the
       pattern that was stripped from 117 other elements on this site for
       reading as generated, and it was the last thing keeping framer-motion in
       this file. The section renders visible. */
    <section
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
            A schematic predicts what a circuit should do and a simulation models it. The part I
            care about starts once the board exists and has to prove it. A three-phase motor wound
            by hand, which needed rewinding before it would turn at all. A waste classifier pointed
            at real rubbish instead of a tidy sample set. A 10&nbsp;V reference whose entire job is
            to sit still.
          </p>
          <p className="font-sans" style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8 }}>
            Every write-up here says whether a number was <em>calculated</em>, <em>simulated</em>{' '}
            or <em>measured</em>. Those are not the same thing, and blurring them is the easiest way
            to make work look better than it was.
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
    </section>
  )
}

export default function HomePage() {
  usePageMeta(null, 'Precision analog, PCB design, and embedded systems. Electrical Engineering at UBC Okanagan.')
  return (
    <>
      {/* ── Split-screen Hero ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col md:flex-row md:min-h-screen overflow-hidden">
        {/* Top (mobile) / Left (desktop): Photo carousel -- 45vh crop on mobile, fills column on desktop */}
        <div className="relative w-full h-[45vh] md:w-[55%] md:h-auto flex-shrink-0 overflow-hidden">
          <HeroCarousel />
        </div>

        {/* Bottom (mobile) / Right (desktop): Editorial text */}
        <div
          className="anim-rise relative z-10 flex flex-col items-center md:items-start justify-center
                     text-center md:text-left
                     px-6 py-10 sm:px-10 md:py-0 md:px-14 lg:px-20 xl:px-24 tv:px-32 md:w-[45%]"
          style={{
            background: 'var(--hero-panel-bg)',
            backdropFilter: 'blur(20px) saturate(130%)',
            WebkitBackdropFilter: 'blur(20px) saturate(130%)',
            boxShadow: 'var(--hero-panel-glow)',
            '--anim-dur': '0.7s',
            '--anim-delay': '0.2s',
            '--rise-from': '18px',
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
            {bio.heroLine}
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
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline font-sans text-sm px-6 py-2.5"
            >
              Résumé
            </a>
          </div>

          <SocialLinks />
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <Divider />

      <About />

      <div className="h-12" />
    </>
  )
}
