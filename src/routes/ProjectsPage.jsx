import { Suspense } from 'react'
import { lazyWithReload } from '../utils/lazyWithReload'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader     from '../components/layout/PageHeader'
import ProjectGallery, { SECTIONS, results } from '../components/ui/ProjectGallery'
import { projects }   from '../data/config'
import WhenVisible from '../components/ui/WhenVisible'
import ErrorBoundary  from '../components/ui/ErrorBoundary'

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <div className="h-64 panel-recessed animate-pulse" />
    </div>
  )
}

function Divider() {
  return (
    <div className="px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <hr style={{ borderColor: 'var(--border)' }} />
    </div>
  )
}

const ProjectVideo = lazyWithReload(() => import('../components/media/ProjectVideo'))
const EcoSortDemo  = lazyWithReload(() => import('../components/ml/EcoSortDemo'))
/* Moved off the home page. Feeble Presence already has a card in the gallery
   above, so its architecture diagram belongs with it rather than being the
   landing page's main content. */
const SystemArchitecture = lazyWithReload(() => import('../components/diagrams/SystemArchitecture'))

/* Catalogue strip: the header of an archive drawer. One ruled band across the
   full width, a cell per section with its count, then the competition
   results. Counted from the same list the register and the cards render, so
   it cannot disagree with them. "Results" are the register's Result column
   (course tags excluded); one of them is a finalist listing, not a placing, so
   the cell does not say "placings". There is no total cell: "15 entries" is
   already printed twice on this screen. The section cells are the only jumps
   to the card sections, which is what earns the strip its height (contract
   section 15). Drawn from lg up only: on a tablet it wraps into two ragged
   rows, and on a phone the "Jump to a project" key already does its job. */
const RESULTS = projects.reduce((n, p) => n + results(p).length, 0)

function CatalogueStrip() {
  return (
    <nav aria-label="Project catalogue" className="catalogue-strip hidden lg:grid -mt-2 mb-6">
      {SECTIONS.map((s, i) => (
        <a key={s.key} href={`#projects-${s.key}`} className="catalogue-cell catalogue-link">
          <span className="legend font-readout" style={{ color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</span>
          <span className="legend catalogue-label">{s.label}</span>
          <span className="font-readout catalogue-count">{projects.filter((p) => p.category === s.key).length}</span>
        </a>
      ))}
      <p className="catalogue-cell catalogue-fact">
        <span className="legend catalogue-label">Competition results</span>
        <span className="font-readout catalogue-count">{RESULTS}</span>
      </p>
    </nav>
  )
}

export default function ProjectsPage() {
  usePageMeta('Projects', 'Competitive design, professional practice and software projects: UBC Okanagan coursework, engineering team work and personal software.')
  return (
    <>
      {/* This route had no page heading at all, and so no h1 -- it opened
          straight into the gallery's own section labels. */}
      <section className="px-5 pt-12 pb-0 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
        <PageHeader
          eyebrow="Competition · Coursework · Software"
          title="Projects"
          intro="Competition hardware, coursework that outgrew the assignment, and the software I write around it. Where a figure is calculated rather than measured, the entry says so."
        >
          <CatalogueStrip />
        </PageHeader>
      </section>

      <ProjectGallery />

      <Divider />

      {/* DeLorean video */}
      <div id="section-delorean">
        <ErrorBoundary label="DeLorean Video">
          <Suspense fallback={<SectionFallback />}>
            <ProjectVideo
              src="/videos/APSC 171-2024-T1C4-16-SW_cmp.mp4"
              poster="/display/DeLorean.png"
              title="APSC 171 DeLorean · SolidWorks Showcase"
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      <Divider />

      {/* EcoSort ML */}
      <ErrorBoundary label="EcoSort ML Demo">
        <WhenVisible>
          <Suspense fallback={<SectionFallback />}>
            <EcoSortDemo sectionId="section-ecosort" />
          </Suspense>
        </WhenVisible>
      </ErrorBoundary>

      <Divider />

      {/* Feeble Presence architecture. WhenVisible, because lazy() alone only
          splits the chunk -- mounting it on first render still downloads React
          Flow immediately, at the bottom of a page whose LCP is at the top. */}
      <ErrorBoundary label="Feeble Presence Architecture">
        <WhenVisible>
          <Suspense fallback={<SectionFallback />}>
            <SystemArchitecture />
          </Suspense>
        </WhenVisible>
      </ErrorBoundary>

      <div className="h-6" />
    </>
  )
}
