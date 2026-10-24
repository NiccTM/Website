import { useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { Link } from 'react-router-dom'
import { profile, bio, contact } from '../data/config'
import SocialLinks from '../components/ui/SocialLinks'
import FeaturedWork from '../components/ui/FeaturedWork'
import { thumbSrc, displaySrc } from '../utils/thumbs'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// ─── Hero photographs ─────────────────────────────────────────────────────────
// Titles are the photographs' own names (one filename carries a typo, the
// title does not). Nothing here is invented camera metadata.
const HERO_PHOTOS = [
  { src: '/Remastered Photos/Northern Lights.jpg',            title: 'Northern Lights' },
  { src: '/Remastered Photos/Kelowna Night Sky.jpg',          title: 'Kelowna Night Sky' },
  { src: '/Remastered Photos/Yellow Rolling Clouds.jpg',      title: 'Yellow Rolling Clouds' },
  { src: '/Remastered Photos/Kelwona Blue & Orange Sky.jpg',  title: 'Kelowna Blue & Orange Sky' },
  { src: '/Remastered Photos/Kelowna Mountains.jpg',          title: 'Kelowna Mountains' },
  { src: '/Remastered Photos/Ottawa Night.jpg',               title: 'Ottawa Night' },
  { src: '/Remastered Photos/Clouds from Above.jpg',          title: 'Clouds from Above' },
]

const pad2 = (n) => String(n).padStart(2, '0')

/* The optical module: the photograph in a recessed window, a legend strip
   above it, and a bank of numbered selector keys below. It is a bay in the
   home enclosure, not a panel of its own.

   Two rules carried over from the previous hero, both measured, both about
   Largest Contentful Paint:
   - It does not advance on its own. Every slide that painted became a fresh
     LCP candidate, so the metric measured the slideshow (6832ms) instead of
     the load. The keys are the only way to change photo, which also means
     WCAG 2.2.2 does not apply and there is no pause control to provide.
   - The first slide paints at opacity 1 with no animation. Chrome will not
     accept an element as an LCP candidate if its first paint is at opacity 0,
     which once produced NO_LCP and a Performance score of 0.
   Only visited slides are mounted, so a visitor who never presses a key
   downloads exactly one photograph. */
function OpticalModule() {
  const [current, setCurrent] = useState(0)
  const [shown, setShown] = useState(() => [0])
  const reducedMotion = usePrefersReducedMotion()

  function show(i) {
    setCurrent(i)
    setShown((s) => (s.includes(i) ? s : [...s, i]))
  }

  return (
    <figure className="flex flex-col h-full p-3 sm:p-4" aria-label="Photographs by Nic Piraino">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="legend" style={{ color: 'var(--text-muted)' }}>Optical · Cam 01</span>
        <span className="legend font-readout" style={{ color: 'var(--text-muted)' }} aria-hidden="true">
          {pad2(current + 1)} / {pad2(HERO_PHOTOS.length)}
        </span>
      </div>

      {/* The window. Photography stays photographic: no scanlines, no tint,
          no overlay graphics. The bezel is the only instrument element. */}
      <div
        className="relative flex-1 overflow-hidden min-h-[16rem] md:min-h-[26rem]"
        style={{
          background: '#0b0c0b',
          borderRadius: 'var(--radius-control)',
          border: '1px solid #000',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 var(--bevel-hi)',
        }}
      >
        {shown.map((i) => (
          <img
            key={i}
            /* src is the 800px THUMB, not the display tier: this element is
               built by JS, the fetch starts the moment src is set, and srcset
               cannot recall a request already in flight -- measured, the
               display tier (1,614 KB) went over the wire when it was src.
               srcset can still upgrade on a display that needs it. */
            srcSet={`${thumbSrc(HERO_PHOTOS[i].src)} 800w, ${displaySrc(HERO_PHOTOS[i].src)} 4000w`}
            sizes="(max-width: 1023px) 100vw, 58vw"
            fetchpriority={i === 0 ? 'high' : 'auto'}
            src={thumbSrc(HERO_PHOTOS[i].src)}
            alt={i === current ? HERO_PHOTOS[i].title : ''}
            aria-hidden={i === current ? undefined : 'true'}
            className="hero-slide absolute inset-0 w-full h-full object-cover"
            /* A user-initiated change is instant if the OS asks for reduced
               motion. */
            style={{
              opacity: i === current ? 1 : 0,
              transitionDuration: reducedMotion ? '0ms' : '900ms',
            }}
          />
        ))}
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-3">
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-secondary)' }}>
          {HERO_PHOTOS[current].title}
        </span>
        {/* Selector keys. Each is a real button with a 32px face, above the
            24x24 floor of WCAG 2.2 AA 2.5.8. aria-current marks the one on
            screen, and the latched style keys off the same attribute. */}
        <span className="key-bank" role="group" aria-label="Choose photograph">
          {HERO_PHOTOS.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => show(i)}
              aria-label={`Show photograph ${i + 1} of ${HERO_PHOTOS.length}: ${p.title}`}
              aria-current={i === current ? 'true' : undefined}
              className="key key-sm font-readout"
              style={{ minWidth: '2rem', padding: '0.25rem 0.4rem', letterSpacing: 0 }}
            >
              {pad2(i + 1)}
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  )
}

/* The identity plate. Every value comes from config.js or index.html's own
   description; nothing is invented. */
const FOCUS = ['Precision analog', 'PCB design', 'Embedded systems']

function IdentityPlate() {
  return (
    <div className="flex flex-col justify-center h-full px-5 py-6 sm:px-7 lg:p-8">
      <p className="legend legend-rule mb-6" style={{ color: 'var(--text-muted)' }}>
        {profile.location} · {bio.school}
      </p>

      <h1
        className="font-display mb-3"
        style={{
          /* About 14% under the old hero size: the name labels the instrument,
             it is not the instrument. */
          fontSize: 'clamp(2.6rem, 1.9rem + 3.6vw, 5.75rem)',
          fontWeight: 700,
          lineHeight: 0.95,
          color: 'var(--text-primary)',
        }}
      >
        Nic Piraino
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1.1rem, 1rem + 0.4vw, 1.35rem)', lineHeight: 1.4 }}>
        Electrical Engineering, {bio.school}
      </p>

      <dl className="spec-grid mb-8">
        <div>
          <dt>Focus</dt>
          <dd>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {FOCUS.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span aria-hidden="true" className="lamp lamp-ok" />
                  {f}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Program</dt>
          <dd>{bio.program}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link to="/projects" className="key key-primary">Projects</Link>
        <Link to="/hardware" className="key">Hardware</Link>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="key">
          Résumé
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(PDF, opens in a new tab)</span>
        </a>
      </div>
    </div>
  )
}

/* The status strip along the foot of the enclosure: the one live state on
   the page (from config.js), and where to find the work elsewhere. */
function StatusStrip({ className = '' }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-3 sm:px-7 ${className}`}
      style={{ background: 'var(--panel-plate)', borderColor: 'var(--seam)' }}
    >
      <p className="flex items-baseline gap-2.5 min-w-0" style={{ color: 'var(--text-primary)' }}>
        <span aria-hidden="true" className="lamp lamp-ok self-center" />
        <span className="legend" style={{ color: 'var(--text-muted)' }}>Status</span>
        <span>{bio.seeking}</span>
      </p>
      {/* Email sits beside the social links and matches them. SocialLinks.jsx
          is shared, so the address is added here rather than inside it. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <a
          href={`mailto:${contact.email}`}
          className="social-link flex items-center gap-1.5 py-1 font-mono-data text-sm"
        >
          <span aria-hidden="true" className="material-symbols-rounded text-base">mail</span>
          Email
          <span className="sr-only">: {contact.email}</span>
        </a>
        <SocialLinks />
      </div>
    </div>
  )
}

/* Sits directly under the hero so the first thing below the fold is the
   engineering, not a hobby. Every field comes from config.js; program and
   status are not repeated here because the enclosure above already states them. */
const ABOUT_FACTS = [
  { label: 'Previously', value: `${bio.role}, ${bio.employer} (${bio.employerYears})`, to: '/hardware/reference' },
  { label: 'Team',       value: profile.academics.teams.join(' · ') },
  { label: 'Based in',   value: profile.location },
]

function About() {
  return (
    /* No scroll reveal: an IntersectionObserver to fade in a block of prose is
       the pattern stripped from 117 other elements on this site. */
    <section
      aria-labelledby="about-heading"
      className="relative z-10 px-5 pt-16 pb-12 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      <h2 id="about-heading" className="legend legend-rule mb-8" style={{ color: 'var(--text-muted)' }}>
        About
      </h2>

      <div className="grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
        <div className="max-w-[68ch]">
          <p className="mb-5" style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.2rem, 1.05rem + 0.5vw, 1.5rem)', lineHeight: 1.45 }}>
            I build hardware that has to answer to an instrument: precision analog, PCB design,
            embedded systems and electrical metrology.
          </p>
          <p className="mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            A schematic predicts what a circuit should do and a simulation models it. The part I
            care about starts once the board exists and has to prove it. A three-phase motor wound
            by hand, which needed rewinding before it would spin up. A waste classifier pointed
            at real rubbish instead of a tidy sample set. A 10&nbsp;V reference whose entire job is
            to sit still.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Where a number here was <em>calculated</em> rather than <em>measured</em>, the write-up
            says so. Those are not the same thing, and blurring them is the easiest way
            to make work look better than it was.
          </p>

          <div className="flex flex-wrap gap-2 mt-8">
            <Link to="/about" className="key">More about me</Link>
            <Link to="/hardware/reference" className="key">Voltage reference</Link>
          </div>
        </div>

        <dl className="spec-grid w-full">
          {ABOUT_FACTS.map(({ label, value, to }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {to ? (
                  <Link to={to} className="underline underline-offset-[0.2em]" style={{ color: 'var(--accent)' }}>{value}</Link>
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
      {/* ── Hero: one enclosure, three modules ──
          The identity module, the optical module and the status strip share a
          single chassis panel divided by seams, instead of a photo and a name
          floating side by side -- the split hero every portfolio template ships.

          The identity module is FIRST in the DOM: who this is and what Nic works
          on should be read (and tabbed to) before the photo keys, and on a phone
          it makes the LCP element text rather than a photograph. From lg up the
          grid places the photo in the left bay and runs the strip along the
          foot; the reading and focus order stay identity, status, photo. On a
          phone the strip sits between the two modules, so the status is read
          before the photograph rather than after it. */}
      <section className="relative z-10 px-5 pt-8 md:pt-12 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
        {/* Even split from lg, 7:5 from xl: at 1024 a 5/12 identity module left
            ~270px for the spec grid and set the focus list one word per line. */}
        <div className="panel overflow-hidden grid lg:grid-cols-2 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:border-l" style={{ borderColor: 'var(--seam)' }}>
            <IdentityPlate />
          </div>
          <StatusStrip className="border-y lg:border-b-0 lg:col-span-2 lg:row-start-2" />
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <OpticalModule />
          </div>
        </div>
      </section>

      <FeaturedWork />
      <About />
    </>
  )
}
