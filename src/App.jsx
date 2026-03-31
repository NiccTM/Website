import { lazy, Suspense } from 'react'
import ProfileHeader    from './components/ui/ProfileHeader'
import ProjectGallery   from './components/ui/ProjectGallery'
import SocialLinks      from './components/ui/SocialLinks'
import TerminalConsole  from './components/ui/TerminalConsole'

// Lazy-load everything that touches WebGL or large deps
const CanvasBackground   = lazy(() => import('./components/CanvasBackground'))
const AudioSignalChain   = lazy(() => import('./components/diagrams/AudioSignalChain'))
const SystemArchitecture = lazy(() => import('./components/diagrams/SystemArchitecture'))
const ModelViewer        = lazy(() => import('./components/3d/ModelViewer'))
const XRCanvas           = lazy(() => import('./components/3d/XRCanvas'))
const EcoSortDemo        = lazy(() => import('./components/ml/EcoSortDemo'))

function SectionFallback() {
  return (
    <div className="px-6 py-10 sm:px-10 md:px-16 lg:px-24">
      <div
        className="h-48 rounded-xl border-subtle animate-pulse"
        style={{ background: 'var(--bg-surface-1)' }}
      />
    </div>
  )
}

function Divider() {
  return (
    <div className="mx-6 sm:mx-10 md:mx-16 lg:mx-24">
      <hr style={{ borderColor: 'var(--border)' }} />
    </div>
  )
}

export default function App() {
  return (
    <div className="relative min-h-screen w-full" style={{ background: 'var(--bg-base)' }}>
      {/* Particle background — fully isolated, never blocks UI */}
      <Suspense fallback={null}>
        <CanvasBackground />
      </Suspense>

      <main className="relative flex flex-col max-w-7xl mx-auto">
        {/* ── Core identity ── */}
        <ProfileHeader />
        <SocialLinks />
        <TerminalConsole />

        <Divider />

        {/* ── Projects overview ── */}
        <ProjectGallery />

        <Divider />

        {/* ── React Flow diagrams ── */}
        <Suspense fallback={<SectionFallback />}>
          <AudioSignalChain />
        </Suspense>

        <Divider />

        <Suspense fallback={<SectionFallback />}>
          <SystemArchitecture />
        </Suspense>

        <Divider />

        {/* ── 3D model viewer ── */}
        <Suspense fallback={<SectionFallback />}>
          <ModelViewer label="Custom BLDC Motor" />
        </Suspense>

        <Divider />

        {/* ── WebXR inspection ── */}
        <Suspense fallback={<SectionFallback />}>
          <XRCanvas label="VR Inspection Mode" />
        </Suspense>

        <Divider />

        {/* ── ML demo ── */}
        <Suspense fallback={<SectionFallback />}>
          <EcoSortDemo />
        </Suspense>

        {/* Footer */}
        <footer className="px-6 py-10 sm:px-10 md:px-16 lg:px-24">
          <p className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Nic Piraino
          </p>
        </footer>
      </main>
    </div>
  )
}
