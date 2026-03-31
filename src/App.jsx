import { lazy, Suspense } from 'react'
import ProfileHeader from './components/ProfileHeader'
import ProjectGallery from './components/ProjectGallery'
import SocialLinks from './components/SocialLinks'

// Lazy-load the 3D canvas so it never blocks the main thread
const CanvasBackground = lazy(() => import('./components/CanvasBackground'))

export default function App() {
  return (
    <div className="relative min-h-screen w-full" style={{ background: 'var(--bg-base)' }}>
      {/* 3D background — suspended, renders behind all content */}
      <Suspense fallback={null}>
        <CanvasBackground />
      </Suspense>

      {/* Page content */}
      <main className="relative flex flex-col">
        <ProfileHeader />
        <SocialLinks />
        <ProjectGallery />
      </main>
    </div>
  )
}
