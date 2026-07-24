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
/* Moved here from the home page. These diagrams document the same gear the
   High-Fidelity Audio module above shows photos of (Rega Planar 2, Creek CD43,
   Luxman, B&O, Martin Logan), so they belong beside it rather than being the
   first thing a visitor met on the landing page. */
const AudioSignalChain = lazy(() => import('../components/diagrams/AudioSignalChain'))

export default function ArchivePage() {
  usePageMeta('Archive', 'Vinyl record collection, hardware diagnostics, and audio archive — a living record of gear, music, and engineering reference material.')
  return (
    <>
      {/* The page has no visible title, but every route still needs exactly one
          h1: it is what screen readers and search engines use to identify the
          page. Visually hidden, so the design is unchanged. */}
      <h1 className="sr-only">Archive</h1>

      <HardwareDiagnostics />

      <div className="mx-5 sm:mx-8 md:mx-14 lg:mx-20 xl:mx-28 tv:mx-40">
        <hr style={{ borderColor: 'var(--border)' }} />
      </div>

      <ArchiveModules />

      <div className="mx-5 sm:mx-8 md:mx-14 lg:mx-20 xl:mx-28 tv:mx-40">
        <hr style={{ borderColor: 'var(--border)' }} />
      </div>

      <ErrorBoundary label="Audio Signal Chains">
        <Suspense fallback={<SectionFallback />}>
          <AudioSignalChain sectionId="section-audio" />
        </Suspense>
      </ErrorBoundary>

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
