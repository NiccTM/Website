import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader from '../components/layout/PageHeader'
import DocSection from '../components/layout/DocSection'
import ProbeChain from '../components/diagrams/ProbeChain'
import ImageLightbox from '../components/ui/ImageLightbox'
import Picture from '../components/ui/Picture'
import { thumbSrc, photoDims } from '../utils/thumbs'
import { projects } from '../data/config'
import { NUPOWER } from '../data/nupowerCaseStudy'

/* The NuPower P100 display investigation. Its words come from
   data/nupowerCaseStudy.js and the project entry in config.js (the spec list),
   so the register and this page cannot disagree.

   This route's own element is the chain under the header: the result of the
   whole investigation is a boundary, so the page opens on where that boundary
   is (see ProbeChain). It is not a summary of the section directly below; it
   is the answer the sections then justify. Two photographs of the unit, both
   approved, sit beside the sections they illustrate: the opened unit under
   its specs, the board (card slot and USB port) under the access method.

   Nothing on this page may describe a cause. The records do not establish one,
   and tests/data.test.mjs holds the text to that. */

const PROJECT = projects.find((p) => p.id === 'nupower-p100')
const SPECS = PROJECT.expandedDetails.technicalSpecs

function Body({ children }) {
  return (
    <p className="mb-4 last:mb-0" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
      {children}
    </p>
  )
}

const Paras = ({ items }) => items.map((t) => <Body key={t}>{t}</Body>)

/* A photograph in a recessed window, opening full size. Lazy: both sit well
   below the first screen, which belongs to the header and the chain. */
function Photo({ photo }) {
  const [open, setOpen] = useState(false)
  const dims = photoDims(photo.src)
  return (
    <figure className="mt-6 max-w-[34rem]">
      <button
        type="button"
        aria-label={`Open the photograph full size: ${photo.label}`}
        className="panel-recessed block w-full p-1 cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        <Picture
          src={thumbSrc(photo.src)}
          alt={photo.alt}
          width={dims?.w ?? 1500}
          height={dims?.h ?? 1400}
          loading="lazy"
          decoding="async"
          className="w-full h-auto block"
        />
      </button>
      <figcaption className="mt-3">
        <p className="legend" style={{ color: 'var(--text-primary)' }}>{photo.label}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{photo.caption}</p>
      </figcaption>
      {open && <ImageLightbox src={photo.src} label={photo.label} caption={photo.caption} onClose={() => setOpen(false)} />}
    </figure>
  )
}

export default function NuPowerPage() {
  usePageMeta(
    'NuPower P100 Display Investigation',
    'A car display whose screen went blank: a read-only firmware backup over USB, offline RISC-V reverse engineering, and a bare-metal Rust probe that drove the display controller directly. The display still does not work; this is where software stops.'
  )
  const cs = NUPOWER

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 max-w-[72rem] mx-auto w-full">
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          to="/projects#project-nupower-p100"
          className="legend inline-block py-1.5 underline underline-offset-[0.2em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Projects
        </Link>
      </nav>

      <PageHeader eyebrow={cs.eyebrow} title={cs.title} size="article" intro={cs.intro} />

      <ProbeChain chain={cs.chain} />

      <DocSection id="nupower-01" n="01" title="The unit" split>
        <dl className="spec-grid">
          {SPECS.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <Photo photo={cs.photos.opened} />
      </DocSection>

      <DocSection id="nupower-02" n="02" title="Getting in without opening it further" split>
        <Paras items={cs.access} />
        <Photo photo={cs.photos.board} />
      </DocSection>

      <DocSection id="nupower-03" n="03" title="Reading the firmware offline" split>
        <Paras items={cs.offline} />
      </DocSection>

      <DocSection id="nupower-04" n="04" title="The failure" split>
        <Paras items={cs.failure} />
      </DocSection>

      <DocSection id="nupower-05" n="05" title="Bypassing the firmware" split>
        <Paras items={cs.probe} />
        <div className="panel-recessed overflow-x-auto my-6">
          <table className="register w-full text-sm [&_th]:px-1.5 [&_td]:px-1.5 sm:[&_th]:px-3.5 sm:[&_td]:px-3.5">
            <caption className="legend text-left px-3.5 py-2" style={{ color: 'var(--text-muted)' }}>
              Four runs on the unit, 15 November 2026
            </caption>
            <thead>
              <tr>
                <th scope="col">Pattern</th>
                <th scope="col">Controller</th>
                <th scope="col">Screen</th>
              </tr>
            </thead>
            <tbody>
              {cs.runs.map((r, i) => {
                const edge = i === cs.runs.length - 1 ? { borderBottom: 0 } : undefined
                return (
                  <tr key={r.pattern}>
                    <th scope="row" className="font-semibold" style={edge}>{r.pattern}</th>
                    <td style={edge}>Running; read back as planned</td>
                    <td style={edge}>{r.screen}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Body>{cs.runsNote}</Body>
        <Body>{cs.probeAfter}</Body>
      </DocSection>

      <DocSection id="nupower-06" n="06" title="Checking the probe against two sources" split>
        <Paras items={cs.review} />
      </DocSection>

      <DocSection id="nupower-07" n="07" title="Where software stops" split>
        <dl className="spec-grid mb-6">
          <div>
            <dt>Proven</dt>
            <dd>{cs.stop.proven}</dd>
          </div>
          <div>
            <dt>Not observable</dt>
            <dd>{cs.stop.unobservable}</dd>
          </div>
        </dl>
        <p className="font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>{cs.stop.verdict}</p>
      </DocSection>

      <nav aria-label="Related pages" className="pt-5" style={{ borderTop: '1px solid var(--seam)' }}>
        <h2 className="legend mb-2" style={{ color: 'var(--text-muted)' }}>Related</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 list-none">
          {[
            ['Project register', '/projects#project-nupower-p100'],
            ['CD player service record', '/hobbies/cd-player'],
          ].map(([label, to]) => (
            <li key={to}>
              <Link to={to} className="inline-block py-1 underline underline-offset-[0.2em]" style={{ color: 'var(--accent)' }}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
