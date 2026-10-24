import { Link } from 'react-router-dom'
import { thumbSrc, avifThumbSrc } from '../../utils/thumbs'
import Evidence from '../ui/Evidence'
import DigitalTwinPanel from './DigitalTwinPanel'
import { MOTOR_SPECS, MOTOR_REVISIONS, MOTOR_MEDIA, MOTOR_CASE_STUDY_PATH } from '../../data/bldcMotor'

// The data plate, the three revisions and the media captions live in
// data/bldcMotor.js: this section and the /projects/bldc-motor case study read
// the same record, so a figure cannot be corrected on one and left wrong on the
// other.

// ─── Card ─────────────────────────────────────────────────────────────────────
function ChallengeCard({ item, index }) {
  return (
    /* A service card: the problem as found, the change made, and the one
       number that moved. The lamp follows the record's `kind`: red for a real
       failure of the first build, amber for the thermal margin, which was a
       risk designed out rather than a failure seen. */
    <article className="panel flex flex-col">
      <header className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--seam)' }}>
        <h3 className="font-display text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </h3>
        <span aria-hidden="true" className="legend font-readout" style={{ color: 'var(--text-muted)' }}>{String(index + 1).padStart(2, '0')}</span>
      </header>

      <div className="display px-3 py-2 mx-4 mt-3">
        <p className="readout text-sm" style={{ letterSpacing: 0 }}>{item.metric}</p>
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <p className="legend flex items-center gap-2 mb-1" style={{ color: item.kind === 'risk' ? 'var(--status-caution)' : 'var(--status-fault)' }}>
            <span aria-hidden="true" className={`lamp ${item.kind === 'risk' ? 'lamp-caution' : 'lamp-fault'}`} />
            Challenge
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {item.challenge}
          </p>
        </div>
        <div>
          <p className="legend flex items-center gap-2 mb-1" style={{ color: 'var(--status-ok)' }}>
            <span aria-hidden="true" className="lamp lamp-ok" />
            Solution
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {item.solution}
          </p>
        </div>
      </div>
    </article>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MotorLab() {
  return (
    <div id="motor" className="mt-10 scroll-mt-20">
      {/* Section header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-5">
        <h2 className="legend legend-rule flex-1 min-w-[16rem] legend-module">
          BLDC Motor · ENGR 320
        </h2>
        <span className="legend flex flex-wrap items-baseline gap-x-5 gap-y-1" style={{ color: 'var(--text-muted)' }}>
          <span>
            Budget <span className="font-readout" style={{ color: 'var(--text-primary)', letterSpacing: 0 }}>$94.92 / $100 CAD</span>
          </span>
          <Link
            to={MOTOR_CASE_STUDY_PATH}
            className="plate-link inline-flex items-center gap-1 underline underline-offset-[0.2em] py-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Full case study
            <span aria-hidden="true" className="material-symbols-rounded text-base">chevron_right</span>
          </Link>
        </span>
      </div>

      {/* The machine first: topology, winding and the one calculated figure,
          read as a data plate before any of the story. */}
      {/* gap-px over a seam-coloured ground draws the cell dividers at every
          column count without per-index border logic. */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-4 overflow-hidden" style={{ background: 'var(--seam)', border: '1px solid var(--seam)', borderRadius: 'var(--radius-panel)' }}>
        {MOTOR_SPECS.map(({ label, value, evidence }) => (
          <div key={label} className="px-4 py-3" style={{ background: 'var(--panel-raised)' }}>
            <dt className="legend" style={{ color: 'var(--text-muted)' }}>{label}</dt>
            <dd className="font-readout text-base mt-1" style={{ color: 'var(--text-primary)' }}>
              {value}
              {evidence && <Evidence kind={evidence} className="ml-2" />}
            </dd>
          </div>
        ))}
      </dl>

      {/* Digital Twin: CAD cross-section + physical prototype */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DigitalTwinPanel
          /* _cmp suffix is load-bearing, not decoration: .gitignore ignores
             *.mp4 wholesale and re-includes only !*_cmp.mp4, so a video named
             anything else is silently never committed. */
          src={MOTOR_MEDIA.cad.src}
          poster={MOTOR_MEDIA.cad.poster}
          label={MOTOR_MEDIA.cad.label}
          caption={MOTOR_MEDIA.cad.caption}
          icon="view_in_ar"
        />
        <DigitalTwinPanel
          src={MOTOR_MEDIA.photo.src}
          label={MOTOR_MEDIA.photo.label}
          caption={MOTOR_MEDIA.photo.caption}
          icon="precision_manufacturing"
        />
      </div>

      {/* Full-width motor demo video.
          The panel takes the same theme-following surface as the two
          DigitalTwinPanels above it. It used to be rgba(2,13,26,0.6) -- a dark
          navy in BOTH themes -- which is right for a media well but wrong for
          the caption strip underneath, where light-mode text tokens then sat
          near-black on a dark panel and failed contrast. */}
      <div
        className="panel overflow-hidden mb-6"
      >
        <video
          src={MOTOR_MEDIA.demo.src}
          aria-label="Motor prototype demonstration video"
          /* Was unset, which defaults to preload="metadata" and pulls real
             video bytes for an 11.3 MB file on page load. The poster stands in
             until the viewer actually presses play. */
          preload="none"
          /* Not the display tier: a poster is fetched eagerly -- the loading
             attribute does not apply to it -- so display/ put 1,309 KB on the
             wire before anyone pressed play, and this element is at most 420px
             tall.

             The AVIF rather than the 800px JPEG, and specifically the SAME
             AVIF the DigitalTwinPanel above already renders for this photo, so
             the browser serves it from cache and the poster costs nothing.
             Measured before this: motor-proto.jpg (99 KB) and
             motor-proto.avif (42 KB) both went over the wire, the same
             photograph twice, because <video poster> takes one URL and cannot
             negotiate a format the way <picture> does. A browser with no AVIF
             support now shows no poster frame, which is the whole cost. */
          poster={avifThumbSrc(MOTOR_MEDIA.photo.src) ?? thumbSrc(MOTOR_MEDIA.photo.src)}
          loading="lazy"
          controls
          loop
          playsInline
          className="w-full block"
          style={{ maxHeight: '420px', objectFit: 'cover' }}
        />
        <div className="px-3 py-2" style={{ borderTop: '1px solid var(--seam)' }}>
          <p className="legend" style={{ color: 'var(--text-primary)' }}>{MOTOR_MEDIA.demo.label}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{MOTOR_MEDIA.demo.caption}</p>
        </div>
      </div>

      {/* Challenge / Solution cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {MOTOR_REVISIONS.map((item, i) => (
          <ChallengeCard key={item.id} item={item} index={i} />
        ))}
      </div>

    </div>
  )
}
