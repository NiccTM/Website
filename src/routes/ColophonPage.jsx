import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader from '../components/layout/PageHeader'

/* A colophon is the note at the back of a book saying how it was made. It is
   also about the least automatable page a portfolio can have: it only works if
   the person writing it actually built the thing and remembers what went wrong.
   That is the point of it being here. */

const STACK = [
  { label: 'Framework',  value: 'React 18, react-router 7' },
  { label: 'Build',      value: 'Vite 8 (rolldown)' },
  { label: 'Styling',    value: 'Tailwind 3 + hand-written CSS variables' },
  { label: 'Motion',     value: 'Framer Motion, sparingly' },
  { label: '3D',         value: 'three.js via react-three-fiber' },
  { label: 'Diagrams',   value: 'React Flow' },
  { label: 'Type',       value: 'Exo 2, Playfair Display, Material Symbols' },
  { label: 'Hosting',    value: 'Vercel, with serverless functions in /api' },
  { label: 'Images',     value: 'PowerShell + System.Drawing, no npm dependency' },
  { label: 'Tests',      value: 'node:test, on the serverless code' },
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

export default function ColophonPage() {
  usePageMeta(
    'Colophon',
    'How this site is built: the stack, the image pipeline, the performance decisions, and the things I got wrong and had to fix.'
  )

  return (
    <section className="px-5 pt-12 pb-20 sm:px-8 md:px-14 lg:px-20 max-w-[72rem] mx-auto w-full">
      <PageHeader
        eyebrow="Colophon"
        title="How this site is built"
        size="article"
        intro="Every page here argues that a design should be judged by what it measures, so it would be strange not to say what this one is made of. This is the stack, the decisions behind it, and the parts I got wrong."
      />

      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start">
        <div>
          <Section title="Written by hand">
            <Body>
              There is no site builder or template under this. Every component is a file in
              a repository, and the layout is Tailwind utilities with a set of CSS custom
              properties on top for colour, glass and depth. The two themes are the same
              variables with different values, which is why the light mode is a genuinely
              different palette rather than an inverted dark one.
            </Body>
            <Body>
              I use language models heavily while building, and I would rather say that
              than pretend otherwise. What I have found is that the value is not in
              generating code quickly. It is in having a specification, a test, and enough
              understanding to tell whether what came back is right. Several of the fixes
              listed below were things that looked finished and were not.
            </Body>
          </Section>

          <Section title="Images">
            <Body>
              The photographs come off the camera at up to 12000 by 8000 pixels. None of
              that reaches your browser. A script walks the originals folder, which is
              outside the deployed directory entirely, and writes two derivatives of each
              image: an 800 pixel tile for grids and a 4000 pixel version for the lightbox.
              A manifest of intrinsic dimensions is written alongside them so tiles can
              reserve the right box and the page does not jump while images load.
            </Body>
            <Body>
              It runs on System.Drawing through PowerShell rather than an image library from
              npm, because it is a build-time tool on a Windows machine and adding a
              dependency tree to crop photographs seemed like the wrong trade. It also
              applies EXIF orientation and then strips the tag, which I added after a batch
              of photos appeared rotated in the grid and upright in the lightbox.
            </Body>
          </Section>

          <Section title="Things that were wrong">
            <Body>
              A global rule capped every paragraph on the site at 72 characters. It was
              meant for prose and it applied to captions, spec values and button labels
              too, and because it targeted the text rather than the container, no layout
              class could see it. It cost three separate debugging sessions where the copy
              stopped short of its column and looked like a broken grid. It is opt-in now.
            </Body>
            <Body>
              Every missing file used to return a page instead of a 404. The single-page
              routing rule sent anything unmatched to the app shell, which is correct for
              routes and wrong for images, so a broken photograph returned a valid HTML
              document with a 200 and nothing appeared in any log. The rule now only
              matches paths without a file extension.
            </Body>
            <Body>
              Social previews were wrong for a year without anyone noticing, because the
              tags are set after React mounts and the crawlers that read them do not run
              JavaScript. Each route now gets a real static HTML shell written at build
              time, with its own title and description parsed out of the route itself so
              the two cannot drift apart.
            </Body>
          </Section>

          <Section title="Weight">
            <Body>
              The icon font was the single largest asset on the site at 5.2 MB, because the
              full variable font ships unless you ask for a subset. Requesting only the
              icons actually used took it to 119 KB. The deploy went from 639 MB to under
              130 MB by serving derivatives rather than originals.
            </Body>
            <Body>
              The 3D board and the signal-chain diagrams are the two heaviest things here,
              so neither loads until you visit the page that uses it, and the board waits
              for a click before it starts a WebGL context at all. A portfolio that takes
              ten seconds to load has already made its argument about engineering judgement.
            </Body>
          </Section>

          <Section title="Still on the list">
            <Body>
              The repository is far larger than it should be, because full-resolution
              originals are tracked in git history. Rate limiting is written and deployed
              for the classifier endpoint but inert until I set the credentials. And there
              is no CV on here yet, which is probably the most useful missing thing.
            </Body>
          </Section>
        </div>

        {/* ── Side column ── */}
        <div className="flex flex-col gap-8">
          <div
            className="aero-gloss rounded-xl overflow-hidden w-full"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface-1)' }}
          >
            {STACK.map(({ label, value }, i) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 px-4 py-3"
                style={{ borderBottom: i < STACK.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          <div>
            <Heading>Source</Heading>
            <p className="font-sans text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The whole site is public, commit history and all.
            </p>
            <a
              href="https://github.com/NiccTM/Website"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono-data text-sm"
              style={{ color: 'var(--accent)' }}
            >
              github.com/NiccTM/Website
            </a>
          </div>

          <div>
            <Heading>Elsewhere</Heading>
            <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The <Link to="/hardware/reference" style={{ color: 'var(--accent)' }}>voltage reference</Link>{' '}
              is the piece of work I would point at first.{' '}
              <Link to="/about" style={{ color: 'var(--accent)' }}>About</Link> covers the rest.
            </p>
          </div>
        </div>
      </div>

      {/* The one animated element on the page, and only because it is the last
          line: a colophon that performed would undercut what it says. */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="font-mono-data text-sm mt-4"
        style={{ color: 'var(--text-muted)' }}
      >
        Built in Kelowna, British Columbia.
      </motion.p>
    </section>
  )
}
