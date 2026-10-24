import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../../data/config'
import { SKILLS, ELSEWHERE, skillsFor } from '../../data/skills'
import ProjectModal from './ProjectModal'
import { thumbSrc } from '../../utils/thumbs'
import Picture from './Picture'
import ProjectAward from './ProjectAward'

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

const SECTIONS = [
  { key: 'competitive', label: 'Competitive Design' },
  { key: 'practice',    label: 'Professional Practice' },
  { key: 'software',    label: 'Software & Personal' },
]

/* Entry numbers run across the whole register in section order, so No. 07 in
   the index is No. 07 on its card. They are ordinals, not part numbers. */
const pad2 = (n) => String(n).padStart(2, '0')
const ORDERED = SECTIONS.flatMap((s) => projects.filter((p) => p.category === s.key))
const entryNo = (id) => pad2(ORDERED.findIndex((p) => p.id === id) + 1)
/* A 'practice' award is the course tag on a coursework entry, not a placing,
   so it does not belong in a Result column. */
const results = (p) => (p.awards ?? []).filter((a) => a.tier !== 'practice')

/* Skill filter. One selected skill narrows the register and the cards; the
   entry numbers do not change, because they are catalogue ordinals and not row
   counts (a gap in the sequence is the filter working, not a bug). The state
   lives in ProjectGallery and not in the URL: the prerendered shell and the
   first client render are always the unfiltered page, so nothing can mismatch.

   Single-select. Pressing the selected key again returns to All. The labels
   never change; aria-pressed carries the state, and .key[aria-pressed='true']
   draws the latched key. */
const matchesSkill = (skill, id) => skill === 'all' || skillsFor(id).includes(skill)

function SkillFilter({ skill, onSelect, shown }) {
  const elsewhere = skill === 'all' ? [] : ELSEWHERE.filter((e) => e.skills.includes(skill))
  return (
    <div className="mb-8">
      <div role="group" aria-labelledby="skill-filter-legend" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span id="skill-filter-legend" className="legend" style={{ color: 'var(--text-muted)' }}>
          Filter by skill
        </span>
        <span className="key-bank flex-wrap gap-y-[3px] max-w-full">
          <button type="button" className="key key-sm" aria-pressed={skill === 'all'} onClick={() => onSelect('all')}>
            All
          </button>
          {SKILLS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="key key-sm"
              aria-pressed={skill === s.id}
              onClick={() => onSelect(skill === s.id ? 'all' : s.id)}
            >
              {s.label}
            </button>
          ))}
        </span>
      </div>

      {/* Polite live region, rendered on the server too so it is a stable node
          that screen readers already know about when its text changes. */}
      <p aria-live="polite" className="font-mono-data text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
        Showing {shown} of {ORDERED.length} entries
        {elsewhere.length > 0 && ` · ${elsewhere.length} more on other pages`}
      </p>

      {elsewhere.length > 0 && (
        <div className="mt-3">
          <p className="legend" style={{ color: 'var(--text-muted)' }}>Also documented on other pages</p>
          <ul className="mt-1 flex flex-col gap-1">
            {elsewhere.map((e) => (
              <li key={e.id} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Link to={e.to} className="underline underline-offset-[0.2em]" style={{ color: 'var(--accent)' }}>{e.title}</Link>
                {' '}<span style={{ color: 'var(--text-muted)' }}>{e.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* The register: every entry on one table before any of the cards -- an index
   of the work, read like a parts list, rather than a wall of equal tiles.
   Each row jumps to its card. Values are the cards' own (course code, award
   text); an entry without one shows a dash, not a filler.

   Below md the table is folded behind a key. At 390px it ran about 1,040px,
   so the first photograph started two screens down. The fold is CSS over one
   piece of state that starts closed on both server and client: no hydration
   mismatch, and nothing collapses after load. From md up the key is gone and
   the table always shows, so the desktop register is exactly as it was. It
   stays open after a jump, because closing it would shrink the page above the
   card you just jumped to and move it out from under you. */
function ProjectIndex({ skill }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid gap-4 lg:gap-14 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] mb-14">
      <div className="lg:pt-3">
        <h2 className="legend legend-rule lg:block" style={{ color: 'var(--text-muted)' }}>
          Index · {ORDERED.length} entries
        </h2>
        <p className="hidden lg:block text-sm mt-3 max-w-[28ch]" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Every entry in catalogue order. Each title jumps to its card below.
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="project-index"
          onClick={() => setOpen((v) => !v)}
          className="key md:hidden mt-3"
        >
          <span aria-hidden="true" className={`lamp${open ? ' lamp-ok' : ''}`} />
          Jump to a project
          {/* add/remove, not expand_more/less: those are not in the icon
              subset and would render as their ligature text. */}
          <span aria-hidden="true" className="material-symbols-rounded text-base">{open ? 'remove' : 'add'}</span>
        </button>
      </div>
      <div id="project-index" className={`panel-recessed overflow-x-auto ${open ? 'block' : 'hidden'} md:block`}>
        <table className="register w-full text-sm">
          <caption className="sr-only">Index of projects, by section</caption>
          <thead>
            <tr>
              <th scope="col" className="w-12">No.</th>
              <th scope="col">Entry</th>
              <th scope="col" className="hidden sm:table-cell">Ref.</th>
              <th scope="col" className="hidden md:table-cell">Result</th>
            </tr>
          </thead>
          {ORDERED.every((p) => !matchesSkill(skill, p.id)) && (
            <tbody>
              <tr>
                <td colSpan={4} style={{ color: 'var(--text-secondary)' }}>
                  No register entries match this skill. See the pages listed above.
                </td>
              </tr>
            </tbody>
          )}
          {SECTIONS.map((section) => {
            const rows = ORDERED.filter((p) => p.category === section.key && matchesSkill(skill, p.id))
            if (!rows.length) return null
            return (
            <tbody key={section.key}>
              <tr>
                <th scope="rowgroup" colSpan={4} className="register-group">{section.label}</th>
              </tr>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-readout" style={{ color: 'var(--text-muted)' }}>{entryNo(p.id)}</td>
                  <td>
                    <a href={`#project-${p.id}`} className="register-link">{p.title}</a>
                    {p.caseStudy && (
                      <>
                        {' '}
                        <Link to={p.caseStudy} className="register-link text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                          Case study<span className="sr-only"> for {p.title}</span>
                        </Link>
                      </>
                    )}
                  </td>
                  <td className="hidden sm:table-cell whitespace-nowrap">{p.course ?? '—'}</td>
                  <td className="hidden md:table-cell">
                    {results(p).length ? results(p).map((a) => <span key={a.id} className="block">{a.label}</span>) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            )
          })}
        </table>
      </div>
    </div>
  )
}

function ProjectCard({ project, categoryLabel, featured = false, onExpand }) {
  const hasDetails   = !!project.expandedDetails
  const facts        = project.expandedDetails?.technicalSpecs?.slice(0, 3) ?? []
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
      id={`project-${project.id}`}
      className={`panel card-hover-scale group relative flex flex-col overflow-hidden text-left scroll-mt-20${
        featured ? ' lg:col-span-2' : ''
      }`}
      style={{ cursor: hasDetails ? 'pointer' : 'default' }}
    >
      {/* ── Header strip: the catalogue code, and the award if there is one ── */}
      <div
        className="flex items-center justify-between gap-3 px-3 py-2 min-h-[2.5rem]"
        style={{ borderBottom: '1px solid var(--seam)' }}
      >
        <span className="legend whitespace-nowrap flex items-baseline gap-2" style={{ color: 'var(--text-muted)' }}>
          <span className="font-readout">{entryNo(project.id)}</span>
          {project.course ?? categoryLabel}
        </span>
        {project.awards?.length > 0 && (
          <span className="flex flex-wrap justify-end gap-1">
            {project.awards.slice(0, 1).map((award) => (
              <ProjectAward key={award.id} award={award} />
            ))}
          </span>
        )}
      </div>

      {/* ── Image window ── */}
      {/* A recessed well with a rim around the photograph. Nothing sits on
          the photograph itself: no tint, no overlay, no badge. Aspect follows
          the span, so it has to switch at the same breakpoint. A 34% banner
          crop on a card that is only one column wide is a letterbox sliver; it
          earns that shape only once the card is actually two columns.

          An entry with no photograph has no well at all. It used to get an
          empty plate with a faded trophy or code glyph: a media slot waiting
          for content, which is the template showing through. Without it the
          entry is a text record, so the catalogue carries unequal weights. */}
      {displayImage && (
        <div className="panel-recessed p-1 m-3 mb-0">
          <div className={`relative overflow-hidden pt-[62%]${featured ? ' lg:pt-[34%]' : ''}`}>
            {/* card-img receives the CSS transform from .card-hover-scale:hover.
               Every card image is lazy. The first card used to be eager with
               fetchpriority=high because it was the route's LCP element; the
               register now sits above the cards, so no card is above the fold
               and an eager image would only compete with the page's own text. */}
            <Picture
              src={thumbSrc(displayImage)}
              alt={project.title}
              loading="lazy"
              decoding="async"
              className="card-img absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ── Info area ── */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3
          className="font-display font-bold leading-snug"
          style={{
            color: 'var(--text-primary)',
            fontSize: featured
              ? 'clamp(1.1rem, 0.95rem + 0.8vw, 1.6rem)'
              : 'clamp(0.95rem, 0.85rem + 0.4vw, 1.2rem)',
          }}
        >
          {project.title}
        </h3>
        {/* No line-clamp. Every description used to be cut off mid-word with an
            ellipsis -- "automated waste...", "software repair - SSD..." -- and a
            truncated blurb sitting above a row of keyword tags is the single
            most recognisable generated-portfolio pattern there is. The blurbs
            are now written short enough to finish on their own, and the full
            write-up lives in expandedDetails, which the modal shows. Cards in a
            grid row stretch to the tallest, so nothing breaks if one runs long. */}
        <p className="font-sans leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.78rem, 0.72rem + 0.25vw, 0.9rem)' }}>
          {project.description}
        </p>
        {/* The first three technical facts from the project's own spec table,
            printed on the card -- not hidden in a hover overlay, and not only in
            the modal (which is not prerendered, so a crawler would never see
            them). Spans throughout: the whole card is a <button>. */}
        {facts.length > 0 && (
          <span className="spec-grid text-xs mt-1">
            {facts.map(({ label, value }) => (
              <span key={label}>
                <span className="spec-label">{label}</span>
                <span className="spec-value">{value}</span>
              </span>
            ))}
          </span>
        )}
        <span className="flex flex-wrap gap-1.5 mt-1">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="font-mono-data text-xs px-2 py-0.5"
              style={{
                color: 'var(--text-secondary)',
                background: 'var(--panel-plate)',
                border: '1px solid var(--seam)',
                borderRadius: '2px',
              }}
            >
              {tag}
            </span>
          ))}
        </span>
      </div>

      {/* ── Action ── The whole card is the button; this key is its visible
          label, so it is hidden from the accessibility tree (the card already
          carries the accessible name). */}
      {hasDetails && (
        <div className="px-4 pb-4">
          <span className="key key-sm" aria-hidden="true">
            Open details
            <span className="material-symbols-rounded text-base">open_in_full</span>
          </span>
        </div>
      )}
    </button>
  )
}

function SectionHeading({ label, index }) {
  return (
    <h2
      className="legend legend-rule mb-5 legend-module"
    >
      <span aria-hidden="true" className="font-readout">{String(index + 1).padStart(2, '0')}</span>
      {label}
    </h2>
  )
}

export default function ProjectGallery() {
  const [activeProject, setActiveProject] = useState(null)
  const [skill, setSkill] = useState('all')
  const shown = ORDERED.filter((p) => matchesSkill(skill, p.id)).length

  return (
    /* pt-0: ProjectsPage renders the page header (eyebrow, h1, intro) directly
       above this. The gallery used to carry its own "Selected Work" eyebrow and
       a second <h1>Projects</h1>, which duplicated the page title and put two
       h1s on the route. The page owns the heading; this owns the grid. */
    <section className="relative z-10 px-5 pt-0 pb-12 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <SkillFilter skill={skill} onSelect={setSkill} shown={shown} />
      <ProjectIndex skill={skill} />

      <div className="flex flex-col gap-14">
        {SECTIONS.map((section, si) => {
          /* Filtered before the span arithmetic below, so the wide lead card
             is decided by the cards actually on screen. */
          const sectionProjects = projects.filter((p) => p.category === section.key && matchesSkill(skill, p.id))
          if (!sectionProjects.length) return null
          return (
            <div key={section.key}>
              <SectionHeading label={section.label} index={si} />
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
                    categoryLabel={section.label}
                    featured={i === 0 && (sectionProjects.length + 1) % 3 === 0}
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
