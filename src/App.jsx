import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'

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
const ArchivePage     = lazy(() => import('./routes/ArchivePage'))
const SystemsPage     = lazy(() => import('./routes/SystemsPage'))
const PhotographyPage = lazy(() => import('./routes/PhotographyPage'))
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
                <Route path="archive"       element={<ArchivePage />}     />
                <Route path="systems"       element={<SystemsPage />}     />
                <Route path="photography"   element={<PhotographyPage />} />
                <Route path="*"             element={<NotFound />}        />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UIProvider>
    </ErrorBoundary>
  )
}
