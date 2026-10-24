// ─── Selected engineering work (home page) ────────────────────────────────────
// Three entries, read like an equipment index: what it is, what I did, the one
// decision that mattered, and where it ended up. Every clause is taken from the
// project's own write-up, the voltage-reference page or the résumé. `result`
// says what was shown and, where it matters, what was NOT measured -- the
// result line is the one a reader will quote, so it is the one that has to be
// exactly as strong as the evidence and no stronger. The evidence mark follows
// `result` directly, so it qualifies that claim alone; `resultNote` (budget,
// limits, what was not measured) comes after the mark.

export const FEATURED = [
  {
    id: 'bldc-motor',
    title: 'Three-phase BLDC inrunner',
    context: 'ENGR 320 · Jan – Apr 2026',
    role: 'Research & Presentation Lead, five-person engineering team',
    decision:
      'Near-zero torque turned out to be two faults: PLA stator teeth with a relative permeability of about 1, and a winding that cancelled itself. Steel-bolt teeth (with four times the turns) and a regrouped winding fixed both.',
    result: 'Spins up cleanly on the revised winding.',
    resultNote: '$94.92 of a $100 budget. Speed, torque and efficiency are not reported.',
    evidence: 'obs',
    to: '/projects/bldc-motor',
    linkLabel: 'Read the case study',
    media: { src: '/motor-proto.jpg', alt: 'The revised motor: printed PETG HF base and rotor, steel-bolt stator teeth and hand-wound copper coils' },
  },
  {
    id: 'adr1000',
    title: 'ADR1000 10 V reference',
    context: 'Measurements International · May – Aug 2026',
    role: 'Hardware engineering intern: laid out and assembled two boards to a senior engineer’s design direction',
    decision:
      'The board moved from an LTZ1000 to an ADR1000, which does not sit at the same voltage, so the 10 V gain network was recalculated from what the new reference actually produced.',
    result: 'First unit read 9.9999927 V on an HP 3458A before calibration.',
    resultNote: 'A development reading, not a calibrated specification.',
    evidence: 'meas',
    to: '/hardware/reference',
    linkLabel: 'Read the write-up',
    notice: 'Hardware and data remain the property of Measurements International Ltd.',
    media: { src: '/ltz1000-bench-3458a.jpg', alt: 'An HP 3458A multimeter reading 9.9999927 volts DC at the reference output' },
  },
  {
    id: 'rover-craft',
    title: 'Rover power distribution',
    context: 'Okanagan Rover Craft · CIRC · Sep 2025 – present',
    role: 'Electrical engineer',
    decision:
      'A 24 V LiFePO4 pack through a main fuse and a contactor to individually fused branches, so one faulted branch can be isolated without taking the rest of the rover down.',
    result: 'Ongoing. Pack capacity and branch current ratings are not published yet.',
    evidence: null,
    to: '/projects#project-rover-craft',
    linkLabel: 'See the entry',
    media: null,
  },
]
