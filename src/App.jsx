import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, Suspense } from 'react'
import { lazyWithReload } from './utils/lazyWithReload'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

/* Scrolls to the top on a route change -- or, when the URL carries a hash, to
   that element. Every route is a lazy chunk, so on a cross-page link such as
   /projects#project-rover-craft the target does not exist yet when this effect
   first runs. It starts at the top, then polls once per frame for up to ~2 s
   and gives up (the page simply stays at the top). scrollIntoView() honours
   the cards' scroll-mt-20, so the target clears the sticky header. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined }
    let frame
    let cancelled = false
    let target = hash.slice(1)
    try { target = decodeURIComponent(target) } catch { /* use it as written */ }
    window.scrollTo(0, 0)
    const deadline = performance.now() + 2000
    const seek = () => {
      if (cancelled) return
      const el = document.getElementById(target)
      if (el) { el.scrollIntoView(); return }
      if (performance.now() < deadline) frame = requestAnimationFrame(seek)
    }
    seek()
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [pathname, hash])
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
const BLDCMotorPage   = lazyWithReload(() => import('./routes/BLDCMotorPage'))
const HobbiesPage     = lazyWithReload(() => import('./routes/HobbiesPage'))
const ReferencePage   = lazyWithReload(() => import('./routes/ReferencePage'))
const CDPlayerPage    = lazyWithReload(() => import('./routes/CDPlayerPage'))
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
                <Route path="projects/bldc-motor" element={<BLDCMotorPage />} />
                <Route path="hardware"           element={<HardwarePage />}  />
                <Route path="hardware/reference" element={<ReferencePage />} />
                <Route path="hobbies"            element={<HobbiesPage />}   />
                <Route path="hobbies/cd-player"  element={<CDPlayerPage />}  />
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
