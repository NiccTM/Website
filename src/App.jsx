import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import { UIProvider }    from './context/UIContext'
import ErrorBoundary     from './components/ui/ErrorBoundary'
import AppShell          from './components/layout/AppShell'

const HomePage        = lazy(() => import('./routes/HomePage'))
const ProjectsPage    = lazy(() => import('./routes/ProjectsPage'))
const HardwarePage    = lazy(() => import('./routes/HardwarePage'))
const HobbiesPage     = lazy(() => import('./routes/HobbiesPage'))
const ReferencePage   = lazy(() => import('./routes/ReferencePage'))
const AboutPage       = lazy(() => import('./routes/AboutPage'))
const NotFound        = lazy(() => import('./routes/NotFound'))

export default function App() {
  return (
    <ErrorBoundary label="Application">
      <UIProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={null}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index                element={<HomePage />}        />
                <Route path="projects"      element={<ProjectsPage />}    />
                <Route path="hardware"      element={<HardwarePage />}    />
                <Route path="hobbies"       element={<HobbiesPage />}     />
                <Route path="reference"     element={<ReferencePage />}   />
                <Route path="about"         element={<AboutPage />}       />

                {/* Retired routes. /photography and /archive merged into
                    /hobbies; /systems was only ever the EcoSort demo, which
                    already had a section on /projects. vercel.json serves 308s
                    for these so crawlers and external links land correctly on a
                    cold load -- these client-side redirects only catch in-app
                    navigation that still points at an old path. */}
                <Route path="photography"   element={<Navigate to="/hobbies?tab=photography" replace />} />
                <Route path="archive"       element={<Navigate to="/hobbies" replace />} />
                <Route path="systems"       element={<Navigate to="/projects" replace />} />

                <Route path="*"             element={<NotFound />}        />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UIProvider>
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  )
}
