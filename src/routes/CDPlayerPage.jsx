import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import ImageLightbox from '../components/ui/ImageLightbox'
import PageHeader    from '../components/layout/PageHeader'
import Picture       from '../components/ui/Picture'
import { thumbSrc } from '../utils/thumbs'

/* Photo set, in the order the work happened. Alt text describes what is in the
   frame rather than naming the step, because a screen reader gets the step from
   the surrounding prose and needs the part names instead. */
const PHOTOS = {
  chassis: {
    src: '/20260907_151337.jpg',
    label: 'Opening the A3.2',
    caption: 'Sony transport at left, toroidal transformer centre, Musical Fidelity main board right, analogue output stage top right',
    alt: 'Interior of Musical Fidelity A3.2 CD player showing Sony CD transport, toroidal transformer and Musical Fidelity circuit boards',
  },
  pickup: {
    src: '/20260907_152130.jpg',
    label: 'Identifying the pickup',
    caption: 'The orange flex PCB is marked KSS-213B. Flat-flex cable, polished steel sled rail and drive gearing visible behind it',
    alt: 'Close-up of Sony KSS-213B optical pickup PCB and sled mechanism inside Musical Fidelity A3.2',
  },
  construction: {
    src: '/20260907_152139.jpg',
    label: 'Transport construction',
    caption: 'How the Sony loading assembly, guide rail and Musical Fidelity electronics are packaged together in the chassis',
    alt: 'Angled view of Sony CD loading mechanism, toroidal transformer and Musical Fidelity main PCB inside the A3.2 chassis',
  },
  access: {
    src: '/20260907_152141.jpg',
    label: 'Accessing the mechanism',
    caption: 'Tray and loading assembly part-way through disassembly, before the pickup is reachable',
    alt: 'Sony CD tray and loading assembly partially disassembled inside the Musical Fidelity A3.2',
  },
  clamp: {
    src: '/20260907_195718.jpg',
    label: 'Disc clamp removed',
    caption: 'The felt-faced disc-clamping surface. Nothing was lubricated here -- grease on a clamp face ends up on the disc',
    alt: 'Removed plastic disc clamp assembly from a Sony CD mechanism showing its felt disc-contact surface',
  },
  bench: {
    src: '/20260907_195721.jpg',
    label: 'Loading mechanism stripped',
    caption: 'Tray, loading cams and gear train exposed. Isopropyl alcohol, swabs, gloves and synthetic grease on the bench',
    alt: 'Disassembled Sony CD loading tray and cam gears on a workbench beside isopropyl alcohol, cotton swabs and synthetic grease',
  },
  exposed: {
    src: '/20260907_195715.jpg',
    label: 'KSS-213B fully exposed',
    caption: 'Objective lens, pickup carriage, polished guide shaft, sled rack, spindle assembly and loading gears',
    alt: 'Exposed Sony KSS-213B laser pickup, spindle motor, guide rail and loading gears during Musical Fidelity A3.2 service',
  },
}

/* What was considered before the trimmer pointed at the pickup. Kept as a table
   because the useful part is the reasoning next to each suspect, not the list. */
const SUSPECTS = [
  ['Dirty objective lens',      'Plausible on a twenty-year-old mechanism, and cheap to rule out'],
  ['Dried sled lubricant',      'Would raise tracking resistance, and worst when cold -- which matched the symptom'],
  ['Sled gear or rail debris',  'Could produce intermittent radial tracking errors at no particular place on a disc'],
  ['Spindle motor instability', 'Would cost CLV lock anywhere on a disc rather than at one radius'],
  ['Ageing servo or supply',    'Temperature-dependent behaviour also fits marginal electrolytics'],
  ['Weak KSS-213B pickup',      'Became the leading suspect only after the trimmer test'],
]

const SPECS = [
  { label: 'Player',           value: 'Musical Fidelity A3.2 CD, early 2000s' },
  { label: 'Transport',        value: 'Sony. Manual specifies CDM14BL-5BD25' },
  { label: 'Pickup (manual)',  value: 'KSS213BA/F-NP' },
  { label: 'Pickup (fitted)',  value: 'Marked KSS-213B on the flex PCB' },
  { label: 'Sony service P/N', value: '8-848-379-31' },
  { label: 'Fault',            value: 'Intermittent mistracking on known-good discs' },
  { label: 'Key symptom',      value: 'Elapsed time jumping forward and backward' },
  { label: 'Temperature',      value: 'Worse cold, better once warm' },
  { label: 'Service',          value: 'Lens, sled rail, gear train, loading mechanism' },
  { label: 'Lubricant',        value: 'Permatex 31832 synthetic PTFE grease' },
  { label: 'Key diagnostic',   value: 'Small pickup-trimmer adjustment, observed not measured' },
  { label: 'Status',           value: 'Usable; occasional skip on marginal tracks' },
  { label: 'Planned repair',   value: 'Genuine or verified original KSS-213B' },
]

function Heading({ children }) {
  return (
    <h2
      className="font-mono-data text-base tracking-widest uppercase mb-3"
      style={{ color: 'var(--accent)' }}
    >
      {children}
    </h2>
  )
}

function Body({ children }) {
  return (
    <p className="font-sans mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
      {children}
    </p>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <Heading>{title}</Heading>
      {children}
    </section>
  )
}

/* One photo with its caption, opening the shared lightbox on click. Portrait and
   landscape frames are mixed here, so the well takes the image's own aspect
   rather than forcing a ratio and cropping the part the caption talks about. */
function Figure({ photo, eager = false }) {
  const [open, setOpen] = useState(false)
  return (
    <figure className="mb-8">
      <button
        type="button"
        aria-label={`Open the photograph full size: ${photo.label}`}
        className="relative overflow-hidden cursor-zoom-in rounded-xl w-full block focus:outline-none focus-visible:ring-2"
        onClick={() => setOpen(true)}
        style={{ border: '1px solid var(--border)', '--tw-ring-color': 'var(--accent)' }}
      >
        <Picture
          src={thumbSrc(photo.src)}
          alt={photo.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-auto block"
        />
      </button>
      <figcaption className="font-mono-data text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{photo.label}.</span> {photo.caption}
      </figcaption>
      {open && (
        <ImageLightbox
          src={photo.src}
          label={photo.label}
          caption={photo.caption}
          onClose={() => setOpen(false)}
        />
      )}
    </figure>
  )
}

export default function CDPlayerPage() {
  usePageMeta(
    'CD Player Repair',
    'Servicing the Sony transport in a Musical Fidelity A3.2 CD player: diagnosing intermittent mistracking, cleaning and relubricating the sled and loading mechanism, and tracing the residual fault to an ageing KSS-213B optical pickup.',
  )

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 max-w-[72rem] mx-auto w-full">
      <PageHeader
        eyebrow="Hi-Fi · Transport Service"
        title={<>Musical Fidelity A3.2 CD Player</>}
        size="article"
        intro={<>
          Diagnosing intermittent skipping, servicing the Sony CD mechanism, and tracing what
          is left of the fault to a marginal KSS-213B optical pickup.
        </>}
      />

      {/* Stated before any of the detail, because the rest of this page is an
          inference chain and the reader should know up front where it lands. */}
      <div
        className="mb-12 px-4 py-4 rounded-lg"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}
      >
        <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          My A3.2 developed intermittent tracking errors that made CDs skip and the elapsed time
          jump around. I opened it, found the original Sony KSS-213B pickup, serviced the sled rail
          and loading mechanism, cleaned the optical assembly and renewed the lubricant. That
          improved the transport but did not fix it. A very small adjustment of the pickup trimmer
          then produced a large improvement, which points at reduced optical read margin from an
          ageing pickup. The player is usable and often runs a whole disc without a skip. I am
          sourcing a genuine KSS-213B for the actual repair.
        </p>
      </div>

      <Figure photo={PHOTOS.chassis} eager />

      <Section title="The fault">
        <Body>
          The player skipped. Not one damaged disc and not one spot on one disc: several
          known-good pressed CDs would lose tracking at various points, and the elapsed-time
          display would jump forward or backward when it happened.
        </Body>
        <Body>
          That last detail is the one that matters. A player muting its analogue output leaves the
          counter running normally. A counter that jumps means the transport lost its place in the
          data stream and reacquired somewhere else, so whatever was wrong was upstream of the
          audio, in tracking rather than in the analogue stage.
        </Body>
        <Body>
          It was worse from cold and usually improved once the player had been running a while.
          It also happened on headphones, with the speakers and subwoofer out of the picture
          entirely, which rules out acoustic feedback into the mechanism -- the first thing worth
          eliminating on a turntable-adjacent complaint, and the easiest to assume wrongly.
        </Body>
      </Section>

      <Section title="What it could have been">
        <Body>
          Everything else about the player worked: it recognised discs, the digital section and
          analogue output behaved, and nothing was intermittent except tracking. That left a
          short list.
        </Body>
        <div
          className="rounded-xl overflow-hidden w-full mb-4"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface-1)' }}
        >
          {SUSPECTS.map(([suspect, note], i) => (
            <div
              key={suspect}
              className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 px-4 py-2.5"
              style={{ borderBottom: i < SUSPECTS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="font-mono-data text-sm shrink-0 sm:w-56" style={{ color: 'var(--text-primary)' }}>
                {suspect}
              </span>
              <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
                {note}
              </span>
            </div>
          ))}
        </div>
        <Body>
          The cold-start behaviour pointed at the mechanical suspects, so those got dealt with
          first. They were also the ones I could address without touching anything that affects
          the life of the laser.
        </Body>
      </Section>

      <Section title="Inside the A3.2">
        <Body>
          The chassis screws are tamper-resistant Torx. Underneath, the layout is simple enough to
          read at a glance: the Sony loading mechanism takes the left half, a toroidal transformer
          sits at the rear centre, and Musical Fidelity&rsquo;s own digital, servo and supply
          circuitry occupies the right. The analogue output stage is on its own board by the
          output connectors at the back.
        </Body>
        <Figure photo={PHOTOS.construction} />
        <Body>
          Musical Fidelity&rsquo;s documentation lists the transport as a Sony CDM14BL-5BD25 with a
          KSS213BA/F-NP pickup. The pickup actually fitted to my unit is marked KSS-213B on its flex
          PCB, which puts it in the same Sony family but is not the string the manual uses. Worth
          keeping the distinction rather than flattening it, because it is the difference between
          what the manual says and what is physically in the machine, and the part I eventually buy
          has to match the latter.
        </Body>
        <Figure photo={PHOTOS.pickup} />
      </Section>

      <Section title="Cleaning and mechanical service">
        <Body>
          The mechanism came apart progressively: tray and loading components first, then far
          enough to reach the optical assembly and the sled.
        </Body>
        <Figure photo={PHOTOS.access} />
        <Body>
          The objective lens was cleaned with isopropyl alcohol on a clean swab and almost no
          pressure. The lens is suspended on the focus actuator, so it moves under any force worth
          calling force -- the cleaning has to be gentler than feels productive.
        </Body>
        <Body>
          The sled rides a polished steel guide shaft driven through a plastic gear train and a
          toothed rack. Old lubricant and contamination came off the accessible surfaces, and the
          gears and rack were checked for hardened grease and damaged teeth before anything went
          back on.
        </Body>
        <Figure photo={PHOTOS.clamp} />
        <Body>
          Fresh lubricant was Permatex 31832 multi-purpose synthetic PTFE grease, which is safe
          against both the plastics and the steel here, applied as a thin film on the guide shaft
          and the gear contact faces only. Nothing went on the lens, the spindle hub or any surface
          that touches a disc. Over-greasing a CD mechanism is its own fault mode later on.
        </Body>
        <Figure photo={PHOTOS.bench} />
      </Section>

      <Section title="Why the mechanical service was not the answer">
        <Body>
          Reassembled and tested, the transport was better and still skipped. That is a useful
          result even though it is a negative one: cleaning and relubrication address tracking
          resistance, and if fixing the resistance does not fix the mistracking, the servo is
          probably not losing the fight against friction.
        </Body>
        <Body>
          What was left was the optical side -- how much signal the pickup returns for the servo to
          work with.
        </Body>
      </Section>

      <Section title="The trimmer test, and what it actually proved">
        <Figure photo={PHOTOS.exposed} />
        <Body>
          A very small adjustment of the pickup&rsquo;s trimmer potentiometer produced a
          disproportionately large improvement. Discs that had been unreliable started playing
          through; the remaining skips moved to visibly poor or damaged tracks.
        </Body>
        <Body>
          That response is consistent with an optical system running short of read margin: nudging
          the operating point gave the focus and tracking servos enough signal to hold lock. It
          does not prove that on its own, and this is the point where the page has to be honest
          about its own evidence. The correct way to evaluate a KSS-213 pickup is to measure the RF
          eye pattern and the laser operating current against the service specification. I did not
          do that. What I have is a behavioural response to a control, which is an observation, not
          a measurement, and it can only make the pickup the leading suspect rather than the
          confirmed cause.
        </Body>
        <Body>
          I also stopped once it worked instead of continuing until it worked perfectly. Turning
          that trimmer further increases laser diode current, which buys present-day reliability
          against remaining pickup life. That is a trade worth making deliberately and in small
          amounts, and it is not routine maintenance -- it is a diagnostic with a cost.
        </Body>
      </Section>

      <Section title="Where it stands">
        <Body>
          Before the service, several discs would repeatedly lose tracking and the counter would
          jump around while the player hunted for its place. After cleaning, relubrication and the
          trimmer adjustment, many discs play start to finish normally, and the skipping that is
          left shows up mostly on marginal or damaged tracks.
        </Body>
        <Body>
          So the player is usable, and I would not call it repaired. The original pickup is still
          in it. The adjustment is a life-extension measure on a component that appears to be
          ageing, and it should be read as buying time rather than closing the fault.
        </Body>
      </Section>

      <Section title="Finding a real replacement">
        <Body>
          I am looking for a genuine Sony KSS-213B or KSS213BA-family pickup, ideally new old stock
          or a verified low-use original Sony mechanism. Sony documentation lists the KSS-213B as
          service part 8-848-379-31.
        </Body>
        <Body>
          One candidate is an AudioProz complete KSS-213B mechanism with frame and springs,
          inventory #71242, described as low-use and graded 9 out of 10. Before buying it,
          compatibility has to be confirmed against what is in the A3.2: a shared pickup part does
          not guarantee that the loading frame, spindle assembly and mounting geometry are the
          same, and a mechanism that does not drop into this chassis is not a repair.
        </Body>
        <Body>
          The order of preference is genuine NOS Sony first, then a verified low-use original Sony
          pickup or mechanism, then a reputable aftermarket KSS-213B -- rather than starting with
          an unknown generic clone, which is how a working player becomes a project. I am also not
          treating a KSS-213C or D as an automatic upgrade. The player was engineered around the
          B-family pickup and Sony treats the variants as distinct service parts.
        </Body>
      </Section>

      {/* ── Specs ── */}
      <div className="mb-12">
        <Heading>Specifications</Heading>
        <div
          className="rounded-xl overflow-hidden w-full"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface-1)' }}
        >
          {SPECS.map(({ label, value }, i) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 px-4 py-2.5"
              style={{ borderBottom: i < SPECS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="font-mono-data text-sm shrink-0 sm:w-40" style={{ color: 'var(--text-muted)' }}>
                {label}
              </span>
              <span className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <p className="font-mono-data text-sm mt-3 w-full" style={{ color: 'var(--text-muted)' }}>
          Part numbers are from the Musical Fidelity and Sony service documentation. Everything
          about the fault is observed behaviour: nothing here was measured on an oscilloscope.
        </p>
      </div>

      <p className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
        The rest of the hi-fi, and the other things that get taken apart, are on{' '}
        <Link to="/hobbies" style={{ color: 'var(--accent)' }}>Hobbies</Link>.
      </p>
    </section>
  )
}
