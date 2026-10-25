import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader from '../components/layout/PageHeader'
import { profile, contact, bio } from '../data/config'
import DocSection from '../components/layout/DocSection'

const FACTS = [
  { label: 'Program',    value: bio.program },
  { label: 'School',     value: `${bio.school}, expected ${bio.expected}` },
  { label: 'Previously', value: `${bio.role}, ${bio.employer} (${bio.employerYears})` },
  { label: 'Team',       value: 'Okanagan Rover Craft · CIRC' },
  { label: 'Affiliate',  value: bio.affiliation },
  { label: 'Based in',   value: profile.location },
]

const TOOLSET = [
  { group: 'PCB & electronics', items: ['Cadence OrCAD', 'Altium', 'KiCad', 'Eagle', 'LTspice', 'Schematic capture', 'PCB assembly', 'Soldering'] },
  { group: 'Mechanical & CAD',  items: ['SolidWorks', 'AutoCAD', 'Engineering drawing', '3D printing', 'Substance 3D Painter'] },
  { group: 'Software',          items: ['Python', 'PySide6 / Qt', 'Flask', 'PostgreSQL', 'SQLAlchemy', 'React', 'MATLAB', 'Simulink', 'R'] },
  { group: 'Bench',             items: ['8½-digit DMM', 'Oscilloscope', 'Power supplies', 'Data logging', 'Audio interfaces'] },
]

const AWARDS = [
  { year: '2024', text: 'Third place, Project Design · APSC 171 Design Competition' },
  { year: '2024', text: 'Top 14 finalist · APSC 171 SolidWorks Design Competition' },
  { year: '2023', text: 'First place, Project Impact · APSC 169 Sustainable Design Competition' },
  { year: '2023', text: 'Third place, Project Design · APSC 169 Sustainable Design Competition' },
  { year: '2022', text: 'Second place, Top Academics · St. Mary Catholic High School' },
]

/* The About header is editorial rather than instrumented: the intro is set
   as a standfirst, and under it one status line says what Nic is looking for
   and how to reach Nic. That line replaced the "Currently" row in the facts
   column, so the fact appears once, on the first screen, where a recruiter
   reads it. */
function StatusLine() {
  return (
    <p className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-10">
      {/* Lamp and legend stay together on the first line; only the status
          text wraps, so the lamp never centres between two lines. */}
      <span className="flex items-baseline gap-2">
        <span className="flex flex-none items-center gap-2 self-baseline">
          <span aria-hidden="true" className="lamp lamp-ok" />
          <span className="legend" style={{ color: 'var(--text-muted)' }}>Status</span>
        </span>
        <span style={{ color: 'var(--text-primary)' }}>{bio.seeking}</span>
      </span>
      <span className="flex items-baseline gap-x-5">
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="register-link">
          Résumé<span className="sr-only"> (PDF, opens in a new tab)</span>
        </a>
        <a href={`mailto:${contact.email}`} className="register-link">
          Email<span className="sr-only">: {contact.email}</span>
        </a>
      </span>
    </p>
  )
}

/* Side-column module legend: small, tracked, ruled. */
function Heading({ children, id }) {
  return (
    <h2
      id={id}
      className="legend legend-rule mb-3 legend-module"
    >
      {children}
    </h2>
  )
}

function Body({ children }) {
  return (
    <p className="font-sans mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
      {children}
    </p>
  )
}

/* Swiss document section: a hairline rule, the section number in the legend
   face, then a bold grotesk title and the prose beneath it. */
function Section({ n, title, children }) {
  return <DocSection id={`about-${n}`} n={n} title={title} className="mb-11">{children}</DocSection>
}

export default function AboutPage() {
  usePageMeta(
    'About',
    'Nic Piraino, Electrical Engineering student at UBC Okanagan, working in precision analog, PCB design, embedded systems and electrical metrology.'
  )

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 max-w-[72rem] mx-auto w-full">
      {/* ── Header ── */}
      <PageHeader
        eyebrow="About"
        title="Nic Piraino"
        size="article"
        lede
        introClassName="max-w-[46rem]"
        intro="Electrical Engineering student at UBC Okanagan, working mainly in precision analog, PCB design, embedded systems and electrical metrology. I like engineering problems where the disagreement can eventually be settled by a measurement."
      >
        <StatusLine />
      </PageHeader>

      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start">
        {/* ── Main column ── */}
        <div>
          <Section n="01" title="How I work">
            <Body>
              A schematic predicts how a circuit should behave, a simulation models it, and a
              datasheet defines what a part is supposed to do. The interesting part starts once
              the hardware exists and has to demonstrate what it actually does.
            </Body>
            <Body>
              That has made me sceptical of designing by nominal value alone. Resistors have
              temperature and voltage coefficients. Amplifiers have offset, drift and bias
              current. Copper has resistance, connectors have drop, ground planes carry real
              current, and temperature moves nearly everything. I find those non-idealities more
              interesting than pretending they are not there.
            </Body>
            <Body>
              The distinction I care most about is between <em>calculated</em>,{' '}
              <em>simulated</em> and <em>measured</em>. They are three different claims, and
              treating them as interchangeable is how a design ends up sounding better than it
              is. Where something on this site is calculated, it says so.
            </Body>
          </Section>

          <Section n="02" title="Experience">
            <Body>
              I worked as a Hardware Engineering Intern at Measurements International Ltd., a
              precision electrical metrology company, across summer terms in 2024, 2025 and
              2026. My first term there was largely documentation and configuration control:
              modernising older schematics, producing revised board versions to match existing
              hardware, and generating BOMs, change logs and assembly instructions. That work
              taught me how quickly an electrical design becomes unmaintainable when nobody can
              tell which drawing matches the physical board.
            </Body>
            <Body>
              My later terms moved into precision hardware itself: analog circuitry, current
              sources, impedance-related systems, PCB layout, component selection and
              characterisation. Working where measurement uncertainty is the product rather than
              an afterthought changes the scale at which imperfections matter. A resistor
              tempco that is excellent in a general-purpose circuit can dominate the error budget
              of a precision divider. A precision component does not make a precision
              instrument; the whole signal chain has to preserve it.
            </Body>
          </Section>

          <Section n="03" title="Selected work">
            <Body>
              A <Link to="/hardware/reference" style={{ color: 'var(--accent)' }}>10 V buried-Zener
              voltage reference</Link>, trimmed with a fixed metal-foil resistor network instead
              of a potentiometer, and characterised on an HP 3458A. A three-phase motor wound
              from scratch, where the winding sequence had to be redesigned after the first
              arrangement produced torque cancellation. A waste classifier that had to work on
              real rubbish rather than a curated demo set. On the software side,{' '}
              <Link to="/projects" style={{ color: 'var(--accent)' }}>Tracesight and the other
              applications</Link> are where most of my testing discipline comes from.
            </Body>
          </Section>

          <Section n="04" title="Teams">
            <Body>
              I work on the power system for Okanagan Rover Craft, UBCO&rsquo;s team for the
              Canadian International Rover Challenge: the battery&rsquo;s requirements and selection,
              protection at the pack, a contactor and individually fused branches, and what the
              electronics should measure. It sits at the opposite end of the scale from a voltage
              reference: instead of microvolts, the questions are fault current, conductor sizing
              and whether every connection in the path can carry the load safely. One of them
              didn&rsquo;t: a connector rated below the current its path was being sized for.
            </Body>
            <Body>
              Before that I was on the electrical team for UBCO&rsquo;s Aerial Robotics and
              Rocketry Club as head researcher for a helicopter FPV system, covering analog and
              digital video, transmitters, antennas and cameras. I also presented the project
              plan and budget to the CEO of Sanmina and secured platinum sponsorship for it.
            </Body>
          </Section>

          <Section n="05" title="Software and AI">
            <Body>
              I write a fair amount of software, but I treat it as another instrument rather than
              a separate career. A script that processes characterisation data or an application
              that automates a measurement workflow can be as useful as a physical tool.
            </Body>
            <Body>
              I use language models heavily for development and research, and I have spent real
              time comparing models on coding, reasoning, context handling and cost rather than
              taking provider claims at face value. What I think actually matters is the
              workflow around them: specifications, bounded milestones, test suites, regression
              checks and explicit approval gates for anything irreversible. AI is very good at
              producing confident errors, so the useful skill is being able to tell whether what
              came out is right.
            </Body>
          </Section>
        </div>

        {/* ── Side column ── */}
        <div className="flex flex-col gap-8">
          <dl className="spec-grid text-sm">
            {FACTS.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <Heading>Toolset</Heading>
            <dl className="spec-grid text-sm">
              {TOOLSET.map(({ group, items }) => (
                <div key={group}>
                  <dt>{group}</dt>
                  <dd>{items.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <Heading>Awards</Heading>
            <dl className="spec-grid text-sm">
              {AWARDS.map(({ year, text }) => (
                <div key={text} style={{ gridTemplateColumns: 'minmax(3rem, 3.5rem) minmax(0, 1fr)' }}>
                  <dt className="font-readout">{year}</dt>
                  <dd style={{ lineHeight: 1.6 }}>{text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <Heading>Outside engineering</Heading>
            <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Vinyl and high-fidelity audio, including digitisation and archival workflows.{' '}
              <Link to="/hobbies?tab=photography" style={{ color: 'var(--accent)' }}>Photography</Link>,
              drones and helicopters, custom PC builds and home networking.
            </p>
          </div>

          <div>
            <Heading>Contact</Heading>
            <a
              href={`mailto:${contact.email}`}
              className="inline-block py-1 font-mono-data text-sm underline underline-offset-4"
              style={{ color: 'var(--text-primary)' }}
            >
              {contact.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
