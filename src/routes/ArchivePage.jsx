import { lazy, Suspense } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import ErrorBoundary      from '../components/ui/ErrorBoundary'
import HardwareDiagnostics from '../components/hardware/HardwareDiagnostics'
import ArchiveModules      from '../components/hardware/ArchiveModules'

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      <div className="h-64 rounded-xl border-subtle animate-pulse" style={{ background: 'var(--bg-surface-1)' }} />
    </div>
  )
}

const VinylArchive = lazy(() => import('../components/audio/VinylArchive'))

export default function ArchivePage() {
  usePageMeta('Archive', 'Vinyl record collection, hardware diagnostics, and audio archive — a living record of gear, music, and engineering reference material.')
  return (
    <>
      <HardwareDiagnostics />

      <div className="mx-5 sm:mx-8 md:mx-14 lg:mx-20 xl:mx-28 tv:mx-40">
        <hr style={{ borderColor: 'var(--border)' }} />
      </div>

      <ArchiveModules />

      <div className="mx-5 sm:mx-8 md:mx-14 lg:mx-20 xl:mx-28 tv:mx-40">
        <hr style={{ borderColor: 'var(--border)' }} />
      </div>

      <ErrorBoundary label="Vinyl Archive">
        <Suspense fallback={<SectionFallback />}>
          <VinylArchive />
        </Suspense>
      </ErrorBoundary>

      <div className="h-6" />
    </>
  )
}
