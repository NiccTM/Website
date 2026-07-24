import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePageMeta } from '../hooks/usePageMeta'
import ImageLightbox from '../components/ui/ImageLightbox'
import { thumbSrc } from '../utils/thumbs'

const BENCH_PHOTO = '/ltz1000-bench-3458a.jpg'

const SPECS = [
  { label: 'Reference',    value: 'LTZ1000 buried-Zener, ovenized' },
  { label: 'Raw output',   value: '~7.1 V, measured after warm-up' },
  { label: 'Heater ratio', value: '13 kΩ / 1 kΩ (~60 °C die)' },
  { label: 'Output stage', value: 'ADA4523-1 zero-drift amplifier' },
  { label: 'Support amp',  value: 'OPA2145' },
  { label: 'Trim',         value: 'Fixed VPG bulk metal foil network' },
  { label: 'Foil TCR',     value: 'to ±0.2 ppm/°C' },
  { label: 'Adjustment',   value: 'No potentiometer' },
  { label: 'Verification', value: 'HP 3458A, 8½-digit' },
]

/* Section heading in the same accent/mono style the hardware and archive pages
   use, so this route reads as part of the same site rather than a one-off. */
function Heading({ children }) {
  return (
    <motion.h2
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="font-mono-data text-base tracking-widest uppercase mb-3"
      style={{ color: 'var(--accent)' }}
    >
      {children}
    </motion.h2>
  )
}

function Body({ children }) {
  return (
    <p className="font-sans mb-4 max-w-[68ch]" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
      {children}
    </p>
  )
}

function Section({ title, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      <Heading>{title}</Heading>
      {children}
    </motion.section>
  )
}

export default function ReferencePage() {
  usePageMeta(
    'Voltage Reference',
    'An ultra-stable 10 V DC voltage reference built around an LTZ1000 ovenized buried-Zener reference, trimmed with a fixed precision foil resistor network instead of a potentiometer.',
  )
  const [lightbox, setLightbox] = useState(false)

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      {/* ── Header ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="font-mono-data tracking-[0.18em] uppercase mb-4"
        style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
      >
        Precision Analog · Personal Project
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display mb-6"
        style={{ fontSize: 'clamp(2.25rem, 1.7rem + 3vw, 4.5rem)', fontWeight: 900, lineHeight: 1.02, color: 'var(--text-primary)' }}
      >
        LTZ1000 10&nbsp;V Reference
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="font-sans mb-10 max-w-[68ch]"
        style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.75 }}
      >
        An ultra-stable 10&nbsp;V DC reference built around an LTZ1000 ovenized buried-Zener
        reference, scaled to 10&nbsp;V by a zero-drift amplifier and trimmed with fixed
        precision foil resistors instead of a potentiometer.
      </motion.p>

      {/* ── Bench photo ── */}
      <motion.figure
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-12"
      >
        <div
          className="relative overflow-hidden cursor-zoom-in rounded-xl"
          onClick={() => setLightbox(true)}
          style={{ border: '1px solid var(--border)', aspectRatio: '3 / 2' }}
        >
          <img
            src={thumbSrc(BENCH_PHOTO)}
            alt="HP 3458A 8½-digit multimeter reading 9.9999889 V DC at the reference output"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <figcaption className="font-mono-data text-sm mt-3 max-w-[68ch]" style={{ color: 'var(--text-muted)' }}>
          Bench verification on an HP 3458A. The output reads 9.9999889&nbsp;V DC —
          roughly 11&nbsp;ppm from nominal, in a pre-calibration trim state.
        </figcaption>
      </motion.figure>

      {/* ── Write-up ── */}
      <Section title="Why the LTZ1000">
        <Body>
          The LTZ1000 is not a normal reference chip. It puts a buried Zener, a
          temperature-sensing transistor and a heater on one die. External circuitry holds
          that die at a constant elevated temperature and controls the Zener current, so the
          reference sits in its own thermal environment regardless of what the room is doing.
        </Body>
        <Body>
          Analog Devices specifies the part around 1.2&nbsp;µV peak-to-peak noise,
          0.05&nbsp;ppm/°C drift and 2&nbsp;µV/√kHr long-term stability. That is why these
          turn up inside calibrators and 8½-digit meters rather than ordinary power supplies.
        </Body>
      </Section>

      <Section title="Measured, not assumed">
        <Body>
          The board started out with an ADR1000. Moving to an LTZ1000 changed the raw
          reference voltage, which meant the existing gain network no longer produced 10&nbsp;V.
        </Body>
        <Body>
          Rather than assume a nominal value, I let the board stabilise for about sixteen
          hours and used the voltage it actually produced to calculate the output stage. The
          LTZ1000 is a stability reference, not a factory-trimmed 7.000&nbsp;V source — every
          part lands somewhere slightly different. The absolute value can be calibrated later.
          What matters is that it stays put.
        </Body>
      </Section>

      <Section title="No trim potentiometer">
        <Body>
          The usual way to land on exactly 10&nbsp;V is a trimpot. I did not want one. A
          mechanical wiper is another component that drifts with temperature, vibration and
          age, sitting in the middle of a circuit built for stability.
        </Body>
        <Body>
          Instead the gain is set by a fixed network of VPG bulk metal foil resistors, with
          additional branches placed in parallel to correct the ratio. The resistor technology
          is the point: foil parts reach single-digit and sub-ppm/°C temperature coefficients,
          an order of magnitude better than a trimmer wiper. Replacing the pot with fixed
          resistors is a real improvement rather than a lateral move.
        </Body>
        <Body>
          To choose values I wrote a small solver that searches combinations of the foil
          values available, respects the board&rsquo;s footprints and assembly rules, and only
          proposes networks that can actually be populated.
        </Body>
      </Section>

      <Section title="What the numbers mean">
        <Body>
          The solver reports a resistor-fit residual in the range of ten-thousandths of a ppm.
          That figure describes how closely the resistor arithmetic lands on the target — it is
          not the accuracy of the finished board, and it would be misleading to present it that
          way.
        </Body>
        <Body>
          The real error sources are far larger. The LTZ1000&rsquo;s own noise is already
          around 0.17&nbsp;ppm referred to its 7&nbsp;V output. The amplifier contributes
          offset. Real resistors sit somewhere inside their tolerance bands rather than exactly
          on nominal. Thermal EMFs at dissimilar-metal junctions generate microvolts on their
          own, and the meter carries its own calibration uncertainty.
        </Body>
        <Body>
          Claiming sub-ppm accuracy would require a full traceable uncertainty budget. The
          defensible claim is the calculated nominal output, and the measured reading above.
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
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4 }}
      >
        <Heading>Specifications</Heading>
        <div
          className="rounded-xl overflow-hidden max-w-[46rem]"
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
      </motion.div>

      {lightbox && (
        <ImageLightbox
          src={BENCH_PHOTO}
          label="LTZ1000 10 V reference — bench verification"
          caption="HP 3458A reading 9.9999889 V DC at the amplified output"
          onClose={() => setLightbox(false)}
        />
      )}
    </section>
  )
}
