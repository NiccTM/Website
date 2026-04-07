import { lazy, Suspense } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import ErrorBoundary from '../components/ui/ErrorBoundary'

const EcoSortDemo = lazy(() => import('../components/ml/EcoSortDemo'))

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      <div className="h-64 rounded-xl border-subtle animate-pulse" style={{ background: 'var(--bg-surface-1)' }} />
    </div>
  )
}

export default function SystemsPage() {
  usePageMeta('Systems', 'EcoSort — a real-time ML waste classification system using computer vision and Roboflow, built for sustainable sorting at scale.')
  return (
    <>
      <ErrorBoundary label="EcoSort ML Demo">
        <Suspense fallback={<SectionFallback />}>
          <EcoSortDemo sectionId="section-ecosort" />
        </Suspense>
      </ErrorBoundary>
      <div className="h-6" />
    </>
  )
}
