import { useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import ImageLightbox from '../components/ui/ImageLightbox'
import HardwareTabs  from '../components/layout/HardwareTabs'
import PageHeader    from '../components/layout/PageHeader'
import { thumbSrc, displaySrc } from '../utils/thumbs'

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

/* Section heading in the same accent/mono style the hardware and archive pages
   use, so this route reads as part of the same site rather than a one-off. */
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
    <section
      className="mb-10"
    >
      <Heading>{title}</Heading>
      {children}
    </section>
  )
}

export default function ReferencePage() {
  usePageMeta(
    'Voltage Reference',
    'An ultra-stable 10 V DC voltage reference built around an ADR1000 ovenized buried-Zener reference, developed at Measurements International Ltd.'
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
          An ultra-stable 10&nbsp;V DC reference built around an ADR1000 ovenized buried-Zener
          reference, scaled to 10&nbsp;V by a zero-drift amplifier and trimmed with fixed
          precision foil resistors instead of a potentiometer.
        </>}
      />

      <HardwareTabs />

      {/* Ownership notice, stated up front rather than buried in a footer, so a
          reader knows whose work this is before reading any of it. */}
      <div
        className="flex items-start gap-2.5 mb-12 px-4 py-3 rounded-lg"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}
      >
        <span aria-hidden="true" className="material-symbols-rounded shrink-0" style={{ color: 'var(--accent)', fontSize: '1.05rem', marginTop: '0.1rem' }}>
          gavel
        </span>
        <p className="font-mono-data text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Work carried out at {EMPLOYER} All hardware, designs, test data and
          equipment shown remain the property of {EMPLOYER} See the notice at the
          foot of this page.
        </p>
      </div>

      {/* ── Bench photo ── */}
      <figure
        className="mb-12"
      >
        <button
          type="button"
          aria-label="Open the reference board photograph full size"
          className="relative overflow-hidden cursor-zoom-in rounded-xl w-full block focus:outline-none focus-visible:ring-2"
          onClick={() => setLightbox(true)}
          style={{ border: '1px solid var(--border)', aspectRatio: '3 / 2', '--tw-ring-color': 'var(--accent)' }}
        >
          {/* The 4000px display tier, not the 800px thumbnail: this renders
              near-full-column width, so a thumb was being upscaled ~2x and
              looked soft. srcSet still hands phones the small file rather than
              a ~1 MB image they cannot resolve anyway. */}
          <img
            src={displaySrc(BENCH_PHOTO)}
            srcSet={`${thumbSrc(BENCH_PHOTO)} 800w, ${displaySrc(BENCH_PHOTO)} 4000w`}
            sizes="(max-width: 72rem) 100vw, 72rem"
            width={7866}
            height={5900}
            alt="An HP 3458A 8½-digit multimeter reading 9.9999927 volts DC at the reference output"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </button>
        <figcaption className="font-mono-data text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
          Bench verification on an HP 3458A. The output reads 9.9999927&nbsp;V DC, about
          7&nbsp;µV or 0.7&nbsp;ppm from nominal, in a pre-calibration development state. Not a
          calibrated result or a specification.
        </figcaption>
      </figure>

      {/* ── Write-up ── */}
      <Section title="Why a buried-Zener reference">
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

      <Section title="Measured, not assumed">
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
      </Section>

      <Section title="No trim potentiometer">
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
          The trade-off is real and worth stating: changing the reference device means
          recomputing and repopulating resistors rather than turning a screw. That is exactly
          what the LTZ1000-to-ADR1000 change required. For a board whose whole purpose is
          holding still, that is the right side of the trade.
        </Body>
      </Section>

      <Section title="What the numbers mean">
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
          uncertainty.
        </Body>
        <Body>
          Any claim of sub-ppm accuracy would require a full traceable uncertainty budget. What
          is shown here is a development measurement, not a specification.
        </Body>
      </Section>

      <Section title="Grounding">
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
      <div
        className="mb-12"
      >
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
          Indicative of a development configuration. Not a specification or a datasheet.
        </p>
      </div>

      {/* ── Legal notice ── */}
      <aside
        aria-labelledby="legal-heading"
        className="rounded-xl px-5 py-5"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}
      >
        <h2
          id="legal-heading"
          className="font-mono-data text-sm tracking-widest uppercase mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          Attribution &amp; ownership
        </h2>

        {[
          `This work was carried out at ${EMPLOYER} All hardware, schematics, circuit designs, board files, test data, measurement instruments and associated intellectual property described or shown on this page are and remain the property of ${EMPLOYER}`,
          `This page describes engineering work I contributed to. It is not a product announcement, datasheet, specification or offer of sale, and it does not represent the views or positions of ${EMPLOYER}`,
          'No confidential, proprietary or customer information is disclosed. The component selections and circuit topologies referenced here are drawn from publicly available manufacturer datasheets and application notes.',
          'Measured values shown are from a development configuration. They are not calibrated results, certified specifications, or claims of instrument accuracy, and no traceable uncertainty budget is presented or implied.',
        ].map((text) => (
          <p key={text.slice(0, 40)} className="font-sans text-sm mb-3 last:mb-0" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
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
