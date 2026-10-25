// ─── Skill index ──────────────────────────────────────────────────────────────
// Lets a reader narrow the project register to one kind of work. Every tag
// below is justified by what the project's own write-up says was done, not by
// a keyword in its tag list. A project with no honest fit gets no tag and
// still shows under "All". Comments give the reason for each assignment.

export const SKILLS = [
  { id: 'analog',     label: 'Precision analog' },
  { id: 'pcb',        label: 'PCB design' },
  { id: 'embedded',   label: 'Embedded' },
  { id: 'power',      label: 'Power distribution' },
  { id: 'mechanical', label: 'Electromechanical' },
  { id: 'software',   label: 'Software & tooling' },
]

// project id (config.js) -> skill ids
export const PROJECT_SKILLS = {
  // Printed PLA shell, geometry chosen to tile; crush-load claim is its result.
  unbox:              ['mechanical'],
  // 200+ constrained SolidWorks parts incl. the gullwing mechanism and V6.
  'delorean-apsc171': ['mechanical'],
  // Battery requirements and selection, protection at the pack, contactor,
  // fused branches. Computing and telemetry are selections and requirements
  // so far, not built embedded work, so no 'embedded' tag yet.
  'rover-craft':      ['power'],
  // Raspberry Pi + camera, classification driving a servo flap over PWM;
  // browser crop/back-mapping and the rate-limited serverless proxy.
  ecosort:            ['embedded', 'software'],
  // Printed stator/rotor/housing, winding and magnetic-circuit fixes;
  // Arduino Uno generating the ESC's PWM.
  'bldc-motor':       ['mechanical', 'embedded'],
  'feeble-presence':  ['software'],
  algotraderos:       ['software'],
  tracesight:         ['software'],
  signalvault:        ['software'],
  liquidaudio:        ['software'],
  rigpilot:           ['software'],
  // Deliberately untagged:
  //   firesense    -- a design study; no hardware or firmware was built.
  //   ar2c-fpv     -- analog video/RF assembly and a funded proposal; none of
  //                   the six headings describes it without stretching.
  //   consultation, whistler -- professional practice, not a technical skill.
}

/* Work that is not in the project register because it has its own page. The
   register has no PCB or metrology entry at all, so without these a reader
   who picks "PCB design" would be told there is nothing -- the opposite of
   true. Each is a link to where the work is actually documented. */
export const ELSEWHERE = [
  {
    id: 'adr1000',
    title: 'ADR1000 10 V reference',
    note: 'Measurements International · board layout and assembly',
    to: '/hardware/reference',
    // Résumé: laid out and assembled two ADR1000-based boards.
    skills: ['analog', 'pcb'],
  },
  {
    id: 'heart-rate-pcb',
    title: 'Heart-rate PCB',
    note: 'Altium Designer 24 · inspectable in 3D',
    to: '/hardware',
    skills: ['pcb'],
  },
  {
    id: 'water-contact',
    title: 'Water-contact sensor',
    note: 'UAS Aerospace Team · schematic and KiCad 7.0 layout',
    to: '/hardware',
    skills: ['pcb'],
  },
]

export const skillsFor = (projectId) => PROJECT_SKILLS[projectId] ?? []
