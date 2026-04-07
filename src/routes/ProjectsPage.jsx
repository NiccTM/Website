import { lazy, Suspense } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
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

export default function ProjectsPage() {
  usePageMeta('Projects', 'Competitive design, professional practice, and software projects — from award-winning UBC Engineering teams to embedded systems and full-stack applications.')
  return (
    <>
      <ProjectGallery />

      <Divider />

      {/* DeLorean video */}
      <div id="section-delorean">
        <ErrorBoundary label="DeLorean Video">
          <Suspense fallback={<SectionFallback />}>
            <ProjectVideo
              src="/videos/APSC 171-2024-T1C4-16-SW_cmp.mp4"
              poster="/DeLorean.png"
              title="APSC 171 DeLorean — SolidWorks Showcase"
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

      <div className="h-6" />
    </>
  )
}
