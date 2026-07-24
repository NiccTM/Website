import { lazy, Suspense } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader     from '../components/layout/PageHeader'
import ProjectGallery from '../components/ui/ProjectGallery'
import ErrorBoundary  from '../components/ui/ErrorBoundary'

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      <div className="h-64 rounded-xl border-subtle animate-pulse" style={{ background: 'var(--bg-surface-1)' }} />
    </div>
  )
}

function Divider() {
  return (
    <div className="mx-5 sm:mx-8 md:mx-14 lg:mx-20 xl:mx-28 tv:mx-40">
      <hr style={{ borderColor: 'var(--border)' }} />
    </div>
  )
}

const ProjectVideo = lazy(() => import('../components/media/ProjectVideo'))
const EcoSortDemo  = lazy(() => import('../components/ml/EcoSortDemo'))
/* Moved off the home page. Feeble Presence already has a card in the gallery
   above, so its architecture diagram belongs with it rather than being the
   landing page's main content. */
const SystemArchitecture = lazy(() => import('../components/diagrams/SystemArchitecture'))

export default function ProjectsPage() {
  usePageMeta('Projects', 'Competitive design, professional practice, and software projects, from award-winning UBC Engineering teams to embedded systems and full-stack applications.')
  return (
    <>
      {/* This route had no page heading at all, and so no h1 -- it opened
          straight into the gallery's own section labels. */}
      <section className="px-5 pt-12 pb-0 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
        <PageHeader
          eyebrow="Competition · Coursework · Software"
          title="Projects"
          intro="Competition hardware, coursework that outgrew the assignment, and the software I write around it. Each entry states the constraint it was built against and what was actually measured. Where a figure is calculated rather than measured, it says so."
        />
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
        <Suspense fallback={<SectionFallback />}>
          <EcoSortDemo sectionId="section-ecosort" />
        </Suspense>
      </ErrorBoundary>

      <Divider />

      {/* Feeble Presence architecture */}
      <ErrorBoundary label="Feeble Presence Architecture">
        <Suspense fallback={<SectionFallback />}>
          <SystemArchitecture />
        </Suspense>
      </ErrorBoundary>

      <div className="h-6" />
    </>
  )
}
