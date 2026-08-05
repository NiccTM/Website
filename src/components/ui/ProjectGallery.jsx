import { useState } from 'react'
import { projects } from '../../data/config'
import ProjectModal from './ProjectModal'
import { thumbSrc } from '../../utils/thumbs'
import Picture from './Picture'

// ─── Card-level hero images keyed by project id ───────────────────────────────
const PROJECT_IMAGES = {
  'bldc-motor':       '/motor-proto.jpg',
  'water-contact':    '/Water_Sense_AerospaceTeam_PCB.jpg',
  ecosort:            '/20260321_210541.jpg',
  'feeble-presence':  '/Water wavy August 9.jpg',
  'delorean-apsc171': '/DeLorean.png',
  unbox:              '/UnBox.jpg',
  firesense:          '/FireSense.jpg',
  consultation:       '/Remastered Photos/Canadian Parliament Building 1.jpg',
  whistler:           '/Remastered Photos/Kelowna Mountains.jpg',
  // Software dashboards -- 16:10 hero crops of a real app screen.
  algotraderos:       '/project-heroes/algotraderos.png',
  tracesight:         '/project-heroes/tracesight.png',
  signalvault:        '/project-heroes/signalvault.png',
  rigpilot:           '/project-heroes/rigpilot.png',
}

/* Placeholder for a project with no photograph. This used to be
   linear-gradient(135deg, #1a1a2e, #16213e, #0f3460) -- a blue-to-purple
   diagonal, which is the single most documented visual signature of a
   generated site, and it was rendering on the LiquidAudio card. A flat
   surface tint from the site's own palette says "no photo yet" without
   pretending to be artwork. */
const CATEGORY_PLACEHOLDER = {
  competitive: 'var(--bg-surface-2)',
  practice:    'var(--bg-surface-1)',
  software:    'var(--bg-surface-3)',
}

const AWARD_STYLES = {
  gold:     { bg: 'rgba(10,8,0,0.72)',  border: 'rgba(255,215,0,0.6)',   text: '#FFD700', icon: 'emoji_events' },
  bronze:   { bg: 'rgba(10,6,0,0.72)', border: 'rgba(205,127,50,0.6)',  text: '#CD7F32', icon: 'military_tech' },
  /* These badges sit on a near-black plate in both themes, so they use
     --accent-on-dark rather than --accent: the light-mode accent is a mid
     blue and would land at roughly 3:1 here. */
  cyan:     { bg: 'rgba(0,8,14,0.72)', border: 'rgb(var(--accent-on-dark-rgb) / 0.55)', text: 'var(--accent-on-dark)', icon: 'stars' },
  practice: { bg: 'rgba(0,8,14,0.72)', border: 'rgb(var(--accent-on-dark-rgb) / 0.45)', text: 'var(--accent-on-dark)', icon: 'gavel' },
}

const SECTIONS = [
  { key: 'competitive', label: 'Competitive Design',    icon: 'emoji_events' },
  { key: 'practice',    label: 'Professional Practice', icon: 'gavel' },
  { key: 'software',    label: 'Software & Personal',   icon: 'code' },
]

function ProjectAward({ award }) {
  const style = AWARD_STYLES[award.tier] ?? AWARD_STYLES.cyan
  return (
    <span
      className="inline-flex items-center gap-1 font-mono-data px-2 py-0.5 rounded text-xs border"
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.text,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '0.875rem' }}>{style.icon}</span>
      {award.label}
    </span>
  )
}

function ProjectCard({ project, featured = false, priority = false, onExpand }) {
  const hasDetails   = !!project.expandedDetails
  const heroImage    = PROJECT_IMAGES[project.id]
  const fallbackImage = !heroImage && project.expandedDetails?.subSystems
    ?.flatMap((s) => s.images)?.[0]?.src
  const displayImage = heroImage || fallbackImage || null

  /* <button>, not a clicking <div>: the card is the control that opens the
     project modal and was unreachable by keyboard -- no tab stop, no
     Enter/Space, nothing announced. Nothing inside it is interactive, so a
     button is safe here (no nested controls). */
  return (
    <button
      /* Contents do not perform. Repeated grid items used to stagger in on
         scroll, index by index, which is the pattern every generated portfolio
         template ships with -- and with 13 cards it read as a slideshow. The
         section around them still announces itself; the items inside are just
         there. */
      type="button"
      onClick={hasDetails ? onExpand : undefined}
      aria-label={hasDetails ? `${project.title} -- open details` : undefined}
      /* lg, not sm. The three-column grid only exists from lg up, so below that
         a spanning feature swallowed the entire two-column row and left the
         next card on its own -- one card per row, which is the thing the wide
         feature is supposed to avoid. At sm every card is a single cell and the
         section tiles two across. */
      className={`glass-card card-hover-scale group relative flex flex-col overflow-hidden rounded-xl${
        featured ? ' lg:col-span-2' : ''
      }`}
      style={{
        cursor: hasDetails ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
    >
      {/* ── Image area ── */}
      {/* Aspect follows the span, so it has to switch at the same breakpoint.
          A 34% banner crop on a card that is only one column wide is a letterbox
          sliver; it earns that shape only once the card is actually two columns. */}
      <div className={`relative overflow-hidden pt-[62%]${featured ? ' lg:pt-[34%]' : ''}`}>
        {displayImage ? (
          // card-img class receives CSS transform via .card-hover-scale:hover .card-img
          /* The first card on the page is above the fold and is the route's
             LCP element, so it must not be lazy. It was: Lighthouse measured
             Load Delay 6,245ms against a Load Time of 117ms -- the file itself
             took a tenth of a second, and the browser spent six seconds not
             asking for it. loading="lazy" defers the request until layout has
             proved the element is in view, which for the topmost image on the
             page is pure delay, and fetchpriority then puts it ahead of the
             dozen cards below that genuinely are lazy. */
          <Picture
            src={thumbSrc(displayImage)}
            alt={project.title}
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : undefined}
            decoding="async"
            className="card-img absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: CATEGORY_PLACEHOLDER[project.category] ?? CATEGORY_PLACEHOLDER.practice }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              {/* currentColor via --text-primary, not white: this is a faint
                  watermark on a THEME surface, and white at 10% opacity over a
                  pale panel is nothing at all -- measured 1.06:1 in light mode.
                  The token inverts with the theme, so the mark stays equally
                  faint in both instead of vanishing in one. */}
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '5rem', color: 'var(--text-primary)' }}>
                {project.icon ?? (project.category === 'competitive' ? 'emoji_events' : project.category === 'software' ? 'code' : 'gavel')}
              </span>
            </div>
          </div>
        )}

        {/* Specs overlay -- CSS-driven slide-up on hover, always visible on touch */}
        <div
          className="hover-overlay absolute inset-x-0 bottom-0"
          style={{
            background: 'rgba(10,10,10,0.75)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            padding: '0.875rem',
          }}
        >
          {project.expandedDetails?.technicalSpecs?.slice(0, 3).map((s) => (
            <div key={s.label} className="flex gap-2 mb-1">
              <span className="font-mono-data shrink-0" style={{ color: 'var(--accent-on-dark)', minWidth: '72px', fontSize: '0.875rem' }}>
                {s.label}
              </span>
              <span className="font-mono-data" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.875rem' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Award badge */}
        {project.awards?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {project.awards.slice(0, 1).map((award) => (
              <ProjectAward key={award.id} award={award} />
            ))}
          </div>
        )}

        {/* Expand icon -- always visible on touch, hover-shown on desktop */}
        {hasDetails && (
          /* The circle belongs to the WRAPPER, not to the icon span.
             One span used to be both, carrying the ligature and a 32px round
             background with `flex items-center justify-center`. Neither
             centring class did anything: .material-symbols-rounded declares
             display: inline-block, which wins over the flex utility, so the
             span was never a flex container. With line-height: 1 the glyph then
             sat on a 15.2px line box at the top of a 32px box -- measured 8.48px
             above centre, which is what made the arrow look jammed into the top
             of the disc.
             Those declarations are not incidental: they box the icon at 1em so
             the ligature TEXT cannot reflow the page before the font arrives.
             Fighting them is the bug. Every other icon button here already puts
             the chrome on a `grid place-items-center` wrapper and leaves the
             span as a plain icon, which centres an inline-block correctly. */
          <div
            className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-full"
            style={{
              background: 'rgba(10,10,10,0.65)',
              border: '1px solid rgb(var(--accent-rgb) / 0.35)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {/* aria-hidden, like every other icon on the site. Without it a
                screen reader announces the ligature source text -- the card
                would read "... open_in_full". The card itself is the control
                and carries the accessible name. */}
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-base"
              style={{ color: 'var(--accent-on-dark)' }}
            >
              open_in_full
            </span>
          </div>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="flex flex-col gap-2 p-4">
        {project.course && (
          <p className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
            {project.course}
          </p>
        )}
        <h3 className="font-display font-bold leading-snug fluid-xl" style={{ color: 'var(--text-primary)', fontSize: 'clamp(0.95rem, 0.85rem + 0.4vw, 1.2rem)' }}>
          {project.title}
        </h3>
        {/* No line-clamp. Every description used to be cut off mid-word with an
            ellipsis -- "automated waste...", "software repair - SSD..." -- and a
            truncated blurb sitting above a row of keyword pills is the single
            most recognisable generated-portfolio pattern there is. The blurbs
            are now written short enough to finish on their own, and the full
            write-up lives in expandedDetails, which the modal shows. Cards in a
            grid row stretch to the tallest, so nothing breaks if one runs long. */}
        <p className="font-sans leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.78rem, 0.72rem + 0.25vw, 0.9rem)' }}>
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="font-mono-data px-2 rounded"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', paddingTop: '3px', paddingBottom: '3px' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

function SectionHeading({ label, icon, index }) {
  return (
    <div
      className="flex items-center gap-3 mb-6"
    >
      <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>{icon}</span>
      <h2
        className="font-display font-bold"
        style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.35rem, 1.1rem + 0.8vw, 2rem)' }}
      >
        {label}
      </h2>
      <div className="flex-1 h-px ml-2" style={{ background: 'var(--border)' }} />
    </div>
  )
}

export default function ProjectGallery() {
  const [activeProject, setActiveProject] = useState(null)

  return (
    /* pt-0: ProjectsPage renders the page header (eyebrow, h1, intro) directly
       above this. The gallery used to carry its own "Selected Work" eyebrow and
       a second <h1>Projects</h1>, which duplicated the page title and put two
       h1s on the route. The page owns the heading; this owns the grid. */
    <section className="relative z-10 px-5 pt-0 pb-12 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <div className="flex flex-col gap-14">
        {SECTIONS.map((section, si) => {
          const sectionProjects = projects.filter((p) => p.category === section.key)
          if (!sectionProjects.length) return null
          return (
            <div key={section.key}>
              <SectionHeading label={section.label} icon={section.icon} index={si} />
              {/* Every section is three columns from lg up, so cards always sit
                  several to a row. Dropping a section to two columns to make it
                  tile -- which is what this did before -- meant its feature ran
                  the entire width and the section read as one card per row.

                  What flexes instead is whether the first card spans two
                  columns. A 2-wide feature plus n-1 singles occupies n+1 cells,
                  so it only fills a three-column grid exactly when (n+1) is a
                  multiple of three; otherwise the section ends on a card
                  floating alone beside a two-cell hole, which reads as a bug
                  rather than as deliberate asymmetry.

                  So the feature spans when n+1 divides by three and stays a
                  single cell when n does. Professional Practice (2) and
                  Software & Personal (8) keep their wide lead card; Competitive
                  Design (3) tiles as an even row of three instead. Leading with
                  a wider card is still the default wherever the arithmetic
                  allows, because a page of nothing but equal thirds is the most
                  recognisable generated-portfolio layout there is -- but a hole
                  in the grid is a worse tell than a tidy row. */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {sectionProjects.map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    featured={i === 0 && (sectionProjects.length + 1) % 3 === 0}
                    /* Only the very first card of the first section: that is
                       the one image guaranteed to be above the fold on every
                       viewport, and marking more than one as high priority
                       just re-creates the contention it is meant to avoid. */
                    priority={si === 0 && i === 0}
                    onExpand={() => setActiveProject(project)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

        {activeProject && (
          <ProjectModal
            key={activeProject.id}
            project={activeProject}
            onClose={() => setActiveProject(null)}
          />
        )}

    </section>
  )
}
