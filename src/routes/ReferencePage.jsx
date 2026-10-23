import { useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import ImageLightbox from '../components/ui/ImageLightbox'
import HardwareTabs  from '../components/layout/HardwareTabs'
import PageHeader    from '../components/layout/PageHeader'
import { thumbSrc, displaySrc } from '../utils/thumbs'
import DocSection from '../components/layout/DocSection'
import Evidence from '../components/ui/Evidence'

const BENCH_PHOTO = '/ltz1000-bench-3458a.jpg'

const EMPLOYER = 'Measurements International Ltd.'

const SPECS = [
  { label: 'Reference',    value: 'ADR1000 buried-Zener, ovenized' },
  { label: 'Raw output',   value: '7.10724428 V, measured after warm-up' },
  { label: 'Previously',   value: 'LTZ1000 (pin-compatible)' },
  { label: 'Output stage', value: 'ADA4523-1 zero-drift amplifier' },
  { label: 'Support amp',  value: 'OPA2145' },
  { label: 'Trim',         value: 'Fixed bulk metal foil network' },
  { label: 'Foil TCR',     value: 'to ±0.2 ppm/°C' },
  { label: 'Adjustment',   value: 'No potentiometer' },
  { label: 'Verification', value: 'HP 3458A, 8½-digit' },
]

/* ── The measurement, as the page itself states it ────────────────────────────
   One source for the readout and everything derived from it, so the display
   and the prose cannot disagree. The meter read 9.9999927 V; the deviation
   from 10 V is -7.3 µV, -0.73 ppm, shown to the same one significant figure
   the write-up uses. No digit here is more precise than the photograph. */
const READING_V   = '9.9999927'
const READING_FMT = '9.999 992 7'   // metrology grouping: threes after the point
const DELTA       = '≈ −7 µV'
const DELTA_PPM   = '≈ −0.7 ppm'

/* Swiss document section: a narrow left column carries the section number
   and title, the prose runs in the wide right column at a reading measure.
   On a phone the two simply stack. */
function Section({ n, title, children }) {
  return <DocSection id={`ref-${n}`} n={n} title={title} split>{children}</DocSection>
}

function Body({ children }) {
  return (
    <p className="mb-4 last:mb-0" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
      {children}
    </p>
  )
}

/* The instrument hero. A readout window for the one measured value, and
   beside it the status panel that says exactly what kind of number it is.
   The status panel is as prominent as the readout on purpose: the interface
   must not look more certain than the evidence. */
function ReferenceReadout() {
  return (
    <section aria-labelledby="readout-heading" className="panel p-3 sm:p-4 mb-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="readout-heading" className="legend" style={{ color: 'var(--text-muted)' }}>Reference output</h2>
        <span className="flex items-center gap-3">
          <Evidence kind="meas" />
          <span className="legend flex items-center gap-2" style={{ color: 'var(--status-caution)' }}>
            <span aria-hidden="true" className="lamp lamp-caution" />
            Development
          </span>
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Display window */}
        <div className="display display-crt px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between legend mb-4" style={{ color: 'var(--display-dim)' }}>
            <span>DC volts</span>
            <span>HP 3458A</span>
          </div>
          <p className="readout whitespace-nowrap" style={{ fontSize: 'clamp(1.9rem, 1.2rem + 3.6vw, 3.9rem)' }}>
            <span aria-hidden="true">{READING_FMT}<span className="unit">V DC</span></span>
            <span className="sr-only">{READING_V} volts DC, as read by an HP 3458A</span>
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(121,201,139,0.18)' }}>
            <div>
              <dt className="legend" style={{ color: 'var(--display-dim)' }}>Δ Nominal</dt>
              <dd className="readout text-lg mt-1">{DELTA}</dd>
            </div>
            <div>
              <dt className="legend" style={{ color: 'var(--display-dim)' }}>Indicative</dt>
              <dd className="readout text-lg mt-1">{DELTA_PPM}</dd>
            </div>
            <div>
              <dt className="legend" style={{ color: 'var(--display-dim)' }}>State</dt>
              <dd className="readout text-lg mt-1" style={{ color: 'var(--display-amber)' }}>DEVELOPMENT</dd>
            </div>
          </dl>
        </div>

        {/* Measurement status: what this number is and is not */}
        <div className="panel-recessed p-4 sm:p-5">
          <h3 className="legend mb-3" style={{ color: 'var(--text-muted)' }}>Measurement status</h3>
          <ul className="flex flex-col gap-2.5 text-sm" style={{ color: 'var(--text-primary)' }}>
            <li className="flex gap-2.5"><span aria-hidden="true" className="lamp lamp-caution mt-1.5" />Development measurement, pre-calibration</li>
            <li className="flex gap-2.5"><span aria-hidden="true" className="lamp mt-1.5" />Not a calibration result</li>
            <li className="flex gap-2.5"><span aria-hidden="true" className="lamp mt-1.5" />Not a guaranteed specification</li>
            <li className="flex gap-2.5"><span aria-hidden="true" className="lamp mt-1.5" />
              <span>Meter uncertainty alone is about 2.5&nbsp;ppm, larger than the 0.7&nbsp;ppm deviation shown</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default function ReferencePage() {
  usePageMeta(
    'Voltage Reference',
    'A 10 V DC voltage reference built around an ADR1000 ovenized buried-Zener reference, developed at Measurements International Ltd.'
  )
  const [lightbox, setLightbox] = useState(false)

  return (
    /* Article measure, not the 1600px grid width the gallery pages use. At
       1600px the photo ran the full container while the prose sat at ~68ch,
       leaving a very wide empty column to its right. Capping the whole article
       keeps the image and the text on the same measure. */
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 max-w-[72rem] mx-auto w-full">
      {/* ── Header ── */}
      <PageHeader
        eyebrow={`Precision Analog · ${EMPLOYER}`}
        title={<>ADR1000 10&nbsp;V Reference</>}
        size="article"
        intro={<>
          A 10&nbsp;V DC reference built around an ADR1000 ovenized buried-Zener
          reference, scaled to 10&nbsp;V by a zero-drift amplifier and trimmed with fixed
          precision foil resistors instead of a potentiometer.
        </>}
      />

      <HardwareTabs />

      {/* Ownership notice, stated up front rather than buried in a footer, so a
          reader knows whose work this is before reading any of it. */}
      <div className="panel-recessed flex flex-col sm:flex-row items-start gap-1 sm:gap-3 mb-8 px-4 py-3">
        <span className="legend shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>Notice</span>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Work carried out at {EMPLOYER} All hardware, designs, test data and
          equipment shown remain the property of {EMPLOYER} See the notice at the
          foot of this page.
        </p>
      </div>

      <ReferenceReadout />

      {/* ── Bench photo ── */}
      <figure className="panel p-3 sm:p-4 mb-12">
        <p className="legend mb-3" style={{ color: 'var(--text-muted)' }}>Bench verification · Photograph</p>
        <button
          type="button"
          aria-label="Open the reference board photograph full size"
          className="relative overflow-hidden cursor-zoom-in w-full block"
          onClick={() => setLightbox(true)}
          style={{ border: '1px solid #000', borderRadius: 'var(--radius-control)', aspectRatio: '3 / 2' }}
        >
          {/* The 4000px display tier, not the 800px thumbnail: this renders
              near-full-column width, so a thumb was being upscaled ~2x and
              looked soft. srcSet still hands phones the small file rather than
              a ~1 MB image they cannot resolve anyway. */}
          <img
            src={displaySrc(BENCH_PHOTO)}
            srcSet={`${thumbSrc(BENCH_PHOTO)} 800w, ${displaySrc(BENCH_PHOTO)} 2560w`}
            sizes="(max-width: 72rem) 100vw, 72rem"
            width={7866}
            height={5900}
            alt="An HP 3458A 8½-digit multimeter reading 9.9999927 volts DC at the reference output"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </button>
        <figcaption className="text-sm mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Bench verification on an HP 3458A. The output reads 9.9999927&nbsp;V DC, about
          7&nbsp;µV or 0.7&nbsp;ppm from nominal, in a pre-calibration development state. Not a
          calibrated result or a specification.
        </figcaption>
      </figure>

      {/* ── Write-up ── */}
      <Section n="01" title="Why a buried-Zener reference">
        <Body>
          The ADR1000 is not a normal reference chip. It puts a buried Zener, a
          temperature-sensing transistor and a heater on one die. External circuitry holds
          that die at a constant elevated temperature and controls the Zener current, so the
          reference sits in its own thermal environment regardless of what the room is doing.
        </Body>
        <Body>
          That is the reason this class of part turns up inside calibrators and 8½-digit
          meters rather than ordinary power supplies. The figure of merit is not how close the
          raw output sits to a round number. It is how little that output moves over time and
          temperature.
        </Body>
      </Section>

      <Section n="02" title="Measured, not assumed">
        <Body>
          The board originally ran an LTZ1000 and was later changed to an ADR1000. The two are
          pin-compatible, but they do not sit at the same voltage, so the swap was not a
          drop-in. The entire 10&nbsp;V scaling network had to be recalculated around the new
          device.
        </Body>
        <Body>
          Rather than assume a nominal value, the board was left to stabilise and the gain
          network was calculated from the voltage it actually produced. These parts are
          stability references, not factory-trimmed sources; every individual device lands
          somewhere slightly different. The absolute value can be calibrated later. What
          matters is that it stays put.
        </Body>
        <Body>
          Two boards were built and characterised this way, assembled about a week apart, with a
          separate diagnosis session afterward. Building a second unit and comparing it against
          the first matters because a design that only exists once cannot show whether its
          behaviour is repeatable or coincidental.
        </Body>
      </Section>

      <Section n="03" title="No trim potentiometer">
        <Body>
          The usual way to land on exactly 10&nbsp;V is a trimpot. This design avoids one. A
          mechanical wiper is another component that drifts with temperature, vibration and
          age, sitting in the middle of a circuit built for stability.
        </Body>
        <Body>
          Instead the gain is set by a fixed network of bulk metal foil resistors, with
          additional branches placed in parallel to correct the ratio. The resistor technology
          is the point: foil parts reach single-digit and sub-ppm/°C temperature coefficients,
          far better than a trimmer wiper. To choose values I wrote a small solver that
          searches combinations of the foil values available and only proposes networks that
          can actually be populated on the board.
        </Body>
        <Body>
          The cost is that changing the reference device means
          recomputing and repopulating resistors rather than turning a screw. That is exactly
          what the LTZ1000-to-ADR1000 change required. For a board whose whole purpose is
          holding still, that is the right side of the trade.
        </Body>
      </Section>

      <Section n="04" title="What the numbers mean">
        <Body>
          The solver reports a resistor-fit residual far below a ppm. That figure describes how
          closely the resistor arithmetic lands on the target. It is not the accuracy of the
          finished board, and presenting it as such would be misleading.
        </Body>
        <Body>
          The real error sources are much larger. The reference has its own noise. The
          amplifier contributes offset. Real resistors sit somewhere inside their tolerance
          bands rather than exactly on nominal. Thermal EMFs at dissimilar-metal junctions
          generate microvolts on their own, and the meter carries its own calibration
          uncertainty: the 3458A's 24-hour 10&nbsp;V DC specification is 0.5&nbsp;ppm of reading
          plus 0.05&nbsp;ppm of range, and factory traceability to NIST adds roughly 2&nbsp;ppm of
          reading on top of that &mdash; call it 2.5&nbsp;ppm from the meter alone, larger than
          the 0.7&nbsp;ppm deviation being reported above.
        </Body>
        <Body>
          Any claim of sub-ppm accuracy would require a full traceable uncertainty budget. What
          is shown here is a development measurement, not a specification.
        </Body>
      </Section>

      <Section n="05" title="Grounding">
        <Body>
          At this level a ground plane is not automatically a single node. The heater draws a
          relatively large and varying current; if that current shares copper with the
          reference return, the resulting drop lands straight on the measurement.
        </Body>
        <Body>
          The board keeps the reference, heater, power and output returns separate and joins
          them at one deliberate point, rather than letting them reconnect somewhere in the
          supply.
        </Body>
      </Section>

      {/* ── Specs ── */}
      <Section n="06" title="Specifications">
        <dl className="spec-grid">
          {SPECS.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm mt-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span aria-hidden="true" className="lamp lamp-caution" />
          Indicative of a development configuration. Not a specification or a datasheet.
        </p>
      </Section>

      {/* ── Legal notice ── */}
      <aside aria-labelledby="legal-heading" className="panel-recessed px-5 py-5 mt-8">
        <h2 id="legal-heading" className="legend mb-3" style={{ color: 'var(--text-secondary)' }}>
          Attribution &amp; ownership
        </h2>

        {[
          `This work was carried out at ${EMPLOYER} All hardware, schematics, circuit designs, board files, test data, measurement instruments and associated intellectual property described or shown on this page are and remain the property of ${EMPLOYER}`,
          `This page describes engineering work I contributed to. It is not a product announcement, datasheet, specification or offer of sale, and it does not represent the views or positions of ${EMPLOYER}`,
          'No confidential, proprietary or customer information is disclosed. The component selections and circuit topologies referenced here are drawn from publicly available manufacturer datasheets and application notes.',
          'Measured values shown are from a development configuration. They are not calibrated results, certified specifications, or claims of instrument accuracy, and no traceable uncertainty budget is presented or implied.',
        ].map((text) => (
          <p key={text.slice(0, 40)} className="text-sm mb-3 last:mb-0 max-w-[80ch]" style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {text}
          </p>
        ))}
      </aside>

      {lightbox && (
        <ImageLightbox
          src={BENCH_PHOTO}
          label="10 V reference, bench verification"
          caption="HP 3458A reading 9.9999927 V DC at the amplified output"
          onClose={() => setLightbox(false)}
        />
      )}
    </section>
  )
}
