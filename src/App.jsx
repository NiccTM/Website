import { lazy, Suspense } from 'react'
import ErrorBoundary      from './components/ui/ErrorBoundary'
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
const ProjectVideo       = lazy(() => import('./components/media/ProjectVideo'))

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

// Wraps lazy sections with both Suspense and ErrorBoundary
function Section({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <div className="relative min-h-screen w-full" style={{ background: 'var(--bg-base)' }}>
      {/* Particle background — isolated, silent failure */}
      <ErrorBoundary silent>
        <Suspense fallback={null}>
          <CanvasBackground />
        </Suspense>
      </ErrorBoundary>

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
        <Section><AudioSignalChain /></Section>
        <Divider />
        <Section><SystemArchitecture /></Section>

        <Divider />

        {/* ── DeLorean video showcase ── */}
        <Section>
          <ProjectVideo
            src="/videos/APSC 171-2024-T1C4-16-SW.mp4"
            poster="/videos/delorean-poster.jpg"
            title="APSC 171 DeLorean — SolidWorks Showcase"
          />
        </Section>

        <Divider />

        {/* ── DeLorean engine — explodable 3D model ── */}
        <Section>
          <ModelViewer
            modelPath="/models/delorean-engine.glb"
            label="DeLorean Engine Assembly"
          />
        </Section>

        <Divider />

        {/* ── BLDC Motor 3D model ── */}
        <Section>
          <ModelViewer label="Custom BLDC Motor" />
        </Section>

        <Divider />

        {/* ── WebXR inspection ── */}
        <Section><XRCanvas label="VR Inspection Mode" /></Section>

        <Divider />

        {/* ── ML demo ── */}
        <Section><EcoSortDemo /></Section>

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
