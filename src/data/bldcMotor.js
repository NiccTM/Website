// ─── BLDC motor: one record, two pages ────────────────────────────────────────
// The /hardware motor section and the /projects/bldc-motor case study both read
// from here, so a figure cannot be corrected on one page and left wrong on the
// other. The modal's own write-up and full spec list stay in config.js (the
// project entry); the case study reads those too rather than copying them.
// Text only the case study shows (its prose and the evidence notes) lives in
// bldcCaseStudy.js, so the /hardware chunk does not carry it.
//
// Sources: the team's final ENGR 320 presentation (1 Apr 2026: specs, the
// Rₚₕ working, challenges 1, 3 and 4, the winding table and pole sketch), the
// project entry in config.js, the résumé, manufacturer data for the filaments,
// and the hardware page captions. Nic's role is Research & Presentation Lead,
// per the presentation's contributions slide (confirmed by Nic, 24 Oct 2026);
// the résumé's motor entry was corrected to match on 24 Oct 2026. The fixes
// are credited to the team (the winding turns to Rasskazov). Nothing
// here is a measurement the project did not take. Where the record is silent,
// the text says so instead of filling the gap. Claim-by-claim review:
// docs/redesign/ENGINEERING-RECORD.md.
//
// The bolts are structural steel (the presentation's materials list), so the
// text says steel rather than iron. The winding is AaABbBCcC: the
// presentation's challenge slide, the 9-tooth / 8-pole cell of the winding
// table it cites, its hand-drawn pole sketch (each phase S-N-S or N-S-N) and
// the résumé all agree. The site's earlier "AaABbBCCC" was a typo.

export const MOTOR_CASE_STUDY_PATH = '/projects/bldc-motor'

// Machine data plate. Values unchanged from the hardware page; Rₚₕ keeps its
// calculated mark.
export const MOTOR_SPECS = [
  { label: 'Topology', value: '9S / 8P Inrunner' },
  { label: 'Winding',  value: '~200 T/pole · 24 AWG' },
  { label: 'Rₚₕ',      value: '2.02 Ω', evidence: 'calc', note: 'phaseResistance' },
  { label: 'Control',  value: 'Arduino + Hobbywing 30A' },
]

/* Three changes between the original design and the motor that ran. Two were
   faults found on the bench; the third was a thermal margin. `before` /
   `after` feed the case study's comparison table; challenge and solution are
   the hardware page's service cards.

   30 A is the ESC's rating, not a current anyone measured (the bench supply
   was a 0-10 A unit), so nothing here says the motor drew it. No winding or
   housing temperature was recorded: the documented fact is that continuous
   run time was limited to protect the PLA+ stator. The steel teeth arrived
   together with a move from 50 to ~200 turns per pole, so no torque gain is
   attributed to either change on its own. */
export const MOTOR_REVISIONS = [
  {
    id: 'reluctance',
    kind: 'fault',
    icon: 'hub',
    title: 'Magnetic reluctance',
    symptom: 'Almost no torque under power.',
    challenge:
      'With printed PLA teeth (relative permeability ≈ 1, magnetically no different from air) almost the whole flux path was high-reluctance, so the flux, and with it the torque, was far lower than needed.',
    solution:
      'Replaced the PLA teeth with steel bolts, which give the flux a low-reluctance path. The same rebuild raised the winding from 50 to about 200 turns per pole, so the two effects were never separated, and no torque was measured before or after.',
    metric: 'μᵣ: 1 → ~200',
    part: 'Stator teeth',
    before: 'Printed PLA · μᵣ ≈ 1 · 50 turns',
    after: 'Steel bolts · μᵣ ≈ 200 · ~200 turns',
    evidence: 'nom',
    note: 'permeability',
  },
  {
    id: 'thermal',
    kind: 'risk',
    icon: 'thermostat',
    title: 'Thermal limit',
    symptom: 'Not a failure: run time had to be limited to protect the stator.',
    challenge:
      'Resistive (I²R) heating in the windings meant continuous runs had to be kept short, so the PLA+ stator (Tg ≈ 55°C) would not soften and warp into the rotor. No temperature was measured.',
    solution:
      'Replaced the printed wire retainers with steel bolts and reprinted the base, rotor and magnet holders in PETG HF (Tg 66°C on the manufacturer’s datasheet), for more thermal margin than PLA+. Operating temperatures were not recorded.',
    metric: 'Tg: ≈55°C → 66°C',
    part: 'Base, rotor, holders',
    before: 'PLA / PLA+ · Tg ≈ 55°C',
    after: 'PETG HF · Tg 66°C',
    evidence: 'nom',
    note: 'glassTransition',
  },
  {
    id: 'commutation',
    kind: 'fault',
    icon: 'electric_bolt',
    title: 'Winding sequence',
    symptom: 'Oscillated instead of rotating.',
    challenge:
      'With 9 teeth and 8 rotor poles, neighbouring teeth sit 160° apart electrically, so the original ABCABCABC winding put each phase’s three coils 120° apart and their torque contributions cancelled. That matches the oscillation the team saw.',
    solution:
      'Rewound as AaABbBCcC: each phase on three neighbouring teeth, with the middle coil wound the opposite way (lower case), so the three coils add instead of cancelling. After the rewind it spins up cleanly.',
    metric: 'ABCABCABC → AaABbBCcC',
    part: 'Winding order',
    before: 'ABCABCABC',
    after: 'AaABbBCcC',
    evidence: 'obs',
    note: 'spinUp',
  },
]

// Media already on the site. Captions follow the hardware page's.
export const MOTOR_MEDIA = {
  cad:   { src: '/motor-cad_cmp.mp4', poster: '/motor-cad-poster.jpg', label: 'CAD cross-section', caption: '9-slot stator · 8-pole rotor · Wye winding geometry' },
  photo: { src: '/motor-proto.jpg', label: 'Physical prototype', caption: 'PETG HF base and rotor · Steel-bolt stator teeth · 24 AWG windings', alt: 'The revised motor: printed PETG HF base and rotor, steel-bolt stator teeth and hand-wound copper coils' },
  demo:  { src: '/motor_cmp.mp4', label: 'Motor demo', caption: 'Spin-up on the AaABbBCcC winding · Hobbywing Skywalker 30A V2 ESC' },
}
