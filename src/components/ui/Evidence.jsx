/* The evidence mark: how a figure was obtained. Only ever placed where the
   surrounding copy already says so -- it restates provenance, never invents
   it. The glyph fills with the strength of the evidence (a reading taken,
   a figure derived, a behaviour seen); the word is what a
   screen reader hears. */
const KINDS = {
  meas: { glyph: '●', short: 'Meas', full: 'Measured' },
  calc: { glyph: '◐', short: 'Calc', full: 'Calculated' },
  obs:  { glyph: '○', short: 'Obs',  full: 'Observed, not measured' },
}

export default function Evidence({ kind, className = '' }) {
  const k = KINDS[kind]
  if (!k) return null
  return (
    <span className={`evidence evidence-${kind} ${className}`} title={k.full}>
      <span aria-hidden="true">{k.glyph}</span>
      <span aria-hidden="true">{k.short}</span>
      <span className="sr-only">({k.full})</span>
    </span>
  )
}
