import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, Suspense } from 'react'
import { lazyWithReload } from './utils/lazyWithReload'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/* Speed Insights, told which route it is measuring.
   <SpeedInsights /> used to render OUTSIDE <BrowserRouter>, where it cannot
   call useLocation() and therefore has no idea what page it is on. Every
   measurement was filed under the route "Unknown" in the dashboard, so the data
   was arriving but was useless for telling /projects from /colophon -- which is
   the only thing it is there to do.
   The prop wants the route PATTERN rather than the URL, so that /thing/1 and
   /thing/2 aggregate instead of becoming separate rows. Every route on this
   site is static, so the pathname IS the pattern.
   <Analytics /> takes no route prop and reads the URL from the history API
   itself, so it stays where it is. */
function RoutedSpeedInsights() {
  const { pathname } = useLocation()
  return <SpeedInsights route={pathname} />
}
import { UIProvider }    from './context/UIContext'
import ErrorBoundary     from './components/ui/ErrorBoundary'
import AppShell          from './components/layout/AppShell'

/* lazyWithReload, not lazy: chunk filenames are content-hashed, so a deploy
   while someone is browsing turns every not-yet-loaded route into a 404 and
   drops the app into its ErrorBoundary -- whose Retry cannot recover it,
   because React.lazy memoises the rejected promise and re-requests the same
   dead URL. See the note in utils/lazyWithReload.js. */
const HomePage        = lazyWithReload(() => import('./routes/HomePage'))
const ProjectsPage    = lazyWithReload(() => import('./routes/ProjectsPage'))
const HardwarePage    = lazyWithReload(() => import('./routes/HardwarePage'))
const HobbiesPage     = lazyWithReload(() => import('./routes/HobbiesPage'))
const ReferencePage   = lazyWithReload(() => import('./routes/ReferencePage'))
const AboutPage       = lazyWithReload(() => import('./routes/AboutPage'))
const ColophonPage    = lazyWithReload(() => import('./routes/ColophonPage'))
const NotFound        = lazyWithReload(() => import('./routes/NotFound'))

/* The whole app MINUS the router.
   Split out so the build-time prerender can wrap the identical tree in a
   StaticRouter -- BrowserRouter reads window.history and cannot run in Node.
   Everything else, including the route table, stays in one place so the
   prerendered markup cannot drift from what the browser renders. */
export function AppRoutes() {
  return (
    <ErrorBoundary label="Application">
      <UIProvider>
        <>
          <ScrollToTop />
          <RoutedSpeedInsights />
          <Suspense fallback={null}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index                element={<HomePage />}        />
                <Route path="projects"      element={<ProjectsPage />}    />
                <Route path="hardware"           element={<HardwarePage />}  />
                <Route path="hardware/reference" element={<ReferencePage />} />
                <Route path="hobbies"            element={<HobbiesPage />}   />
                <Route path="about"              element={<AboutPage />}     />
                <Route path="colophon"           element={<ColophonPage />}  />

                {/* Retired routes. /photography and /archive merged into
                    /hobbies; /reference moved under /hardware; /systems was
                    only ever the EcoSort demo, which already had a section on
                    /projects. vercel.json serves 308s for these so crawlers and
                    external links land correctly on a cold load -- these
                    client-side redirects only catch in-app navigation that
                    still points at an old path. */}
                <Route path="photography"   element={<Navigate to="/hobbies?tab=photography" replace />} />
                <Route path="archive"       element={<Navigate to="/hobbies" replace />} />
                <Route path="reference"     element={<Navigate to="/hardware/reference" replace />} />
                <Route path="systems"       element={<Navigate to="/projects" replace />} />

                <Route path="*"             element={<NotFound />}        />
              </Route>
            </Routes>
          </Suspense>
        </>
      </UIProvider>
      <Analytics />
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
