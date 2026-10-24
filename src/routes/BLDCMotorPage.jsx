import { Fragment, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader from '../components/layout/PageHeader'
import DocSection from '../components/layout/DocSection'
import EvidenceNote, { EvidenceButton, EvidencePanel } from '../components/ui/EvidenceNote'
import ImageLightbox from '../components/ui/ImageLightbox'
import Picture from '../components/ui/Picture'
import DigitalTwinPanel from '../components/hardware/DigitalTwinPanel'
import { projects } from '../data/config'
import { thumbSrc, avifThumbSrc, photoDims } from '../utils/thumbs'
import { MOTOR_REVISIONS, MOTOR_MEDIA } from '../data/bldcMotor'
import { MOTOR_CASE_STUDY, MOTOR_EVIDENCE } from '../data/bldcCaseStudy'

/* The BLDC motor case study: one directly addressable page for the ENGR 320
   motor. All of its words and figures come from data/bldcMotor.js (shared with
   the /hardware motor section), data/bldcCaseStudy.js (text only this page
   shows) and the project entry in config.js, so the two pages cannot disagree
   and nothing here is a second copy to keep in step.

   Every evidence mark opens to show what it rests on (MOTOR_EVIDENCE, keyed by
   the `note` field in the data). The span around each one keeps the key in
   data-evidence-note so tests can check every mark has a note behind it. */

const PROJECT = projects.find((p) => p.id === 'bldc-motor')
const SPECS = PROJECT.expandedDetails.technicalSpecs

// The spec row whose own value already says "calculated": the mark restates it.
const SPEC_EVIDENCE = { 'Phase resistance': 'phaseResistance' }

const KIND_TAG = {
  fault: { label: 'Fault', ink: 'var(--status-fault)', lamp: 'lamp-fault' },
  risk:  { label: 'Risk',  ink: 'var(--status-caution)', lamp: 'lamp-caution' },
}

function Body({ children }) {
  return (
    <p className="mb-4 last:mb-0" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
      {children}
    </p>
  )
}

function PairGrid({ rows }) {
  return (
    <dl className="spec-grid">
      {rows.map(([label, text]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  )
}

function Mark({ note, className = '' }) {
  return (
    <span data-evidence-note={note} className={className}>
      <EvidenceNote note={MOTOR_EVIDENCE[note]} />
    </span>
  )
}

/* A comparison-table row whose Basis mark opens into a full-width row beneath
   it, so the note reads at the table's width instead of inside a narrow cell. */
function ChangeRow({ r, last }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const note = MOTOR_EVIDENCE[r.note]
  const edge = last && !open ? { borderBottom: 0 } : undefined
  return (
    <Fragment>
      <tr>
        <th scope="row" className="font-semibold" style={edge}>{r.part}</th>
        <td style={edge}>{r.before}</td>
        <td style={edge}>{r.after}</td>
        <td style={edge}>
          <span data-evidence-note={r.note}>
            <EvidenceButton note={note} open={open} onToggle={() => setOpen((v) => !v)} controls={id} />
          </span>
        </td>
      </tr>
      <tr hidden={!open}>
        <td colSpan={4} style={last ? { borderBottom: 0 } : undefined}>
          <EvidencePanel id={id} note={note} open={open} />
        </td>
      </tr>
    </Fragment>
  )
}

/* A service record: what was seen, what it turned out to be, what was changed. */
function ServiceRecord({ item, index }) {
  const tag = KIND_TAG[item.kind]
  return (
    <li>
      <article className="panel">
        <header className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--seam)' }}>
          <div className="min-w-0">
            <p className="legend flex items-center gap-2 mb-1" style={{ color: tag.ink }}>
              <span aria-hidden="true" className={`lamp ${tag.lamp}`} />
              {tag.label}
            </p>
            <h3 className="font-display text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h3>
          </div>
          <span aria-hidden="true" className="legend font-readout" style={{ color: 'var(--text-muted)' }}>{String(index + 1).padStart(2, '0')}</span>
        </header>
        <div className="px-4 pb-2">
          <PairGrid rows={[['Symptom', item.symptom], ['Diagnosis', item.challenge], ['Correction', item.solution]]} />
        </div>
      </article>
    </li>
  )
}

function PrototypePhoto() {
  const [open, setOpen] = useState(false)
  const photo = MOTOR_MEDIA.photo
  const dims = photoDims(photo.src)
  return (
    <figure className="mt-8 max-w-[36rem]">
      <button
        type="button"
        aria-label={`Open the photograph full size: ${photo.label}`}
        className="panel-recessed relative overflow-hidden cursor-zoom-in w-full block p-1"
        onClick={() => setOpen(true)}
      >
        <Picture
          src={thumbSrc(photo.src)}
          alt={photo.alt}
          width={dims?.w ?? 800}
          height={dims?.h ?? 600}
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

export default function BLDCMotorPage() {
  usePageMeta(
    'BLDC Motor Case Study',
    'A hand-wound three-phase BLDC motor built on a $100 budget for ENGR 320: why the first build produced almost no torque, the two faults behind it, and what changed before it spun up.'
  )
  const cs = MOTOR_CASE_STUDY
  const { cad, demo } = MOTOR_MEDIA

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 max-w-[72rem] mx-auto w-full">
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          to="/projects#project-bldc-motor"
          className="legend inline-block py-1.5 underline underline-offset-[0.2em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Projects
        </Link>
      </nav>

      <PageHeader eyebrow={cs.eyebrow} title={cs.title} size="article" intro={cs.intro} />

      {/* ── Spec rail ── */}
      <dl className="spec-grid mb-12">
        {SPECS.map(({ label, value }) => {
          const ev = SPEC_EVIDENCE[label]
          return (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {value}
                {ev && <Mark note={ev} className="ml-2" />}
              </dd>
            </div>
          )
        })}
      </dl>

      <DocSection id="bldc-01" n="01" title="Overview" split>
        <PairGrid rows={cs.overview} />
      </DocSection>

      <DocSection id="bldc-02" n="02" title="Requirements and constraints" split>
        <PairGrid rows={cs.constraints} />
      </DocSection>

      <DocSection id="bldc-03" n="03" title="Initial design" split>
        <Body>{cs.initial}</Body>
        <div className="mt-6 max-w-[28rem]">
          <DigitalTwinPanel src={cad.src} poster={cad.poster} label={cad.label} caption={cad.caption} icon="view_in_ar" />
        </div>
      </DocSection>

      <DocSection id="bldc-04" n="04" title="What went wrong" split>
        <Body>{cs.wentWrong}</Body>
        <ol className="flex flex-col gap-4 list-none mt-6">
          {MOTOR_REVISIONS.map((item, i) => (
            <ServiceRecord key={item.id} item={item} index={i} />
          ))}
        </ol>
      </DocSection>

      <DocSection id="bldc-05" n="05" title="Engineering changes" split>
        <div className="panel-recessed overflow-x-auto">
          <table className="register w-full text-sm [&_th]:px-1.5 [&_td]:px-1.5 sm:[&_th]:px-3.5 sm:[&_td]:px-3.5">
            <caption className="legend text-left px-3.5 py-2" style={{ color: 'var(--text-muted)' }}>
              First build compared with the revised motor
            </caption>
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">First build</th>
                <th scope="col">Revised</th>
                <th scope="col">Basis</th>
              </tr>
            </thead>
            <tbody>
              {MOTOR_REVISIONS.map((r, i) => (
                <ChangeRow key={r.id} r={r} last={i === MOTOR_REVISIONS.length - 1} />
              ))}
            </tbody>
          </table>
        </div>
        <PrototypePhoto />
      </DocSection>

      <DocSection id="bldc-06" n="06" title="Outcome and limitations" split>
        {cs.outcome.map((text, i) => (
          <Body key={text}>
            {text}
            {i === 0 && <Mark note="spinUp" className="ml-2" />}
          </Body>
        ))}

        <div className="panel overflow-hidden my-6">
          <video
            src={demo.src}
            aria-label="Motor prototype demonstration video"
            preload="none"
            poster={avifThumbSrc(MOTOR_MEDIA.photo.src) ?? thumbSrc(MOTOR_MEDIA.photo.src)}
            loading="lazy"
            controls
            loop
            playsInline
            className="w-full block"
            style={{ aspectRatio: '16 / 9', maxHeight: '420px', objectFit: 'cover' }}
          />
          <div className="px-3 py-2" style={{ borderTop: '1px solid var(--seam)' }}>
            <p className="legend" style={{ color: 'var(--text-primary)' }}>{demo.label}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{demo.caption}</p>
          </div>
        </div>

        <Body>Not part of this write-up, so not given here:</Body>
        <ul className="list-disc pl-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {cs.notReported.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </DocSection>

      <nav aria-label="Related pages" className="pt-5" style={{ borderTop: '1px solid var(--seam)' }}>
        <h2 className="legend mb-2" style={{ color: 'var(--text-muted)' }}>Related</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 list-none">
          {[
            ['Motor on the Hardware page', '/hardware#motor'],
            ['Project register', '/projects#project-bldc-motor'],
            ['ADR1000 voltage reference', '/hardware/reference'],
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
