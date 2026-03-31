import { lazy, Suspense, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import ErrorBoundary      from './components/ui/ErrorBoundary'
import ProfileHeader      from './components/ui/ProfileHeader'
import ProjectGallery     from './components/ui/ProjectGallery'
import SocialLinks        from './components/ui/SocialLinks'
import TerminalConsole    from './components/ui/TerminalConsole'
import { UIProvider, useUI } from './context/UIContext'

// Preload GLB assets at module-parse time so R3F doesn't stall when the
// ModelViewer mounts. No-ops gracefully if the file doesn't exist yet.
useGLTF.preload('/models/delorean-engine.glb')

// Lazy-load everything that touches WebGL or large deps
const CanvasBackground   = lazy(() => import('./components/CanvasBackground'))
const AudioSignalChain   = lazy(() => import('./components/diagrams/AudioSignalChain'))
const SystemArchitecture = lazy(() => import('./components/diagrams/SystemArchitecture'))
const ModelViewer        = lazy(() => import('./components/3d/ModelViewer'))
const XRCanvas           = lazy(() => import('./components/3d/XRCanvas'))
const EcoSortDemo        = lazy(() => import('./components/ml/EcoSortDemo'))
const ProjectVideo       = lazy(() => import('./components/media/ProjectVideo'))
const VinylArchive       = lazy(() => import('./components/audio/VinylArchive'))

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

function Section({ children, label }) {
  return (
    <ErrorBoundary label={label}>
      <Suspense fallback={<SectionFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

// ─── Section IDs used by the terminal command router ─────────────────────────
const SECTION_IDS = {
  audio:    'section-audio',
  vinyl:    'section-vinyl',
  ecosort:  'section-ecosort',
  xr:       'section-xr',
  delorean: 'section-delorean',
  bldc:     'section-bldc',
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Command router (reads from UIContext) ────────────────────────────────────
function CommandRouter() {
  const { command } = useUI()

  useEffect(() => {
    if (!command || command.type !== 'SCROLL_TO') return
    const id = SECTION_IDS[command.payload]
    if (id) scrollTo(id)
  }, [command])

  return null
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <UIProvider>
      <CommandRouter />
      <div className="relative min-h-screen w-full" style={{ background: 'var(--bg-base)' }}>
        {/* Particle background */}
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
          <Section label="Audio Signal Chain">
            <AudioSignalChain sectionId="section-audio" />
          </Section>
          <Divider />
          <Section label="System Architecture">
            <SystemArchitecture />
          </Section>

          <Divider />

          {/* ── DeLorean video showcase ── */}
          <div id="section-delorean">
            <Section label="DeLorean Video">
              <ProjectVideo
                src="/videos/APSC 171-2024-T1C4-16-SW.mp4"
                poster="/videos/delorean-poster.jpg"
                title="APSC 171 DeLorean — SolidWorks Showcase"
              />
            </Section>

            <Section label="DeLorean 3D Model">
              <ModelViewer
                modelPath="/models/delorean-engine.glb"
                label="DeLorean Engine Assembly"
                sectionId="section-delorean-model"
              />
            </Section>
          </div>

          <Divider />

          {/* ── BLDC Motor 3D model ── */}
          <Section label="BLDC Motor Model">
            <ModelViewer
              label="Custom BLDC Motor"
              sectionId="section-bldc"
            />
          </Section>

          <Divider />

          {/* ── WebXR inspection ── */}
          <Section label="WebXR">
            <XRCanvas label="VR Inspection Mode" sectionId="section-xr" />
          </Section>

          <Divider />

          {/* ── Vinyl archive ── */}
          <Section label="Vinyl Archive">
            <VinylArchive />
          </Section>

          <Divider />

          {/* ── ML demo ── */}
          <Section label="EcoSort ML Demo">
            <EcoSortDemo sectionId="section-ecosort" />
          </Section>

          {/* Footer */}
          <footer className="px-6 py-10 sm:px-10 md:px-16 lg:px-24">
            <p className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Nic Piraino
            </p>
          </footer>
        </main>
      </div>
    </UIProvider>
  )
}
