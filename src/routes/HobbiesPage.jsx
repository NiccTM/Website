import { lazy, Suspense, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader from '../components/layout/PageHeader'
import ErrorBoundary from '../components/ui/ErrorBoundary'

/* /photography and /archive used to be two separate nav items. They are the
   same kind of thing -- what I do outside engineering -- so they are one route
   with two tabs. Both panels stay lazy: the photo grid is 82 images and the
   signal chains pull in React Flow, and nobody should pay for the tab they did
   not open. */
const PhotoGallery        = lazy(() => import('../components/photography/PhotoGallery'))
const HardwareDiagnostics = lazy(() => import('../components/hardware/HardwareDiagnostics'))
const ArchiveModules      = lazy(() => import('../components/hardware/ArchiveModules'))
const AudioSignalChain    = lazy(() => import('../components/diagrams/AudioSignalChain'))
const VinylArchive        = lazy(() => import('../components/audio/VinylArchive'))

const TABS = [
  { id: 'audio',       label: 'Audio & Workshop' },
  { id: 'photography', label: 'Photography' },
]
/* First tab is also the one /hobbies opens on -- a tab order that does not
   match what loads by default reads as a bug. Photography therefore has to be
   an explicit ?tab=, which is why the links that used to point at
   /photography carry it. */
const DEFAULT_TAB = 'audio'

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
      <div className="h-64 rounded-xl border-subtle animate-pulse" style={{ background: 'var(--bg-surface-1)' }} />
    </div>
  )
}

function Divider() {
  return (
    <div className="mx-5 sm:mx-8 md:mx-14 lg:mx-20 xl:mx-28 tv:mx-40">
      <hr style={{ borderColor: 'var(--border)' }} />
    </div>
  )
}

function AudioPanel() {
  return (
    <>
      <h2 className="sr-only">Audio and workshop</h2>
      <HardwareDiagnostics />
      <Divider />
      <ArchiveModules />
      <Divider />
      <ErrorBoundary label="Audio Signal Chains">
        <AudioSignalChain sectionId="section-audio" />
      </ErrorBoundary>
      <Divider />
      <ErrorBoundary label="Vinyl Archive">
        <VinylArchive />
      </ErrorBoundary>
    </>
  )
}

export default function HobbiesPage() {
  usePageMeta(
    'Hobbies',
    'Photography, hi-fi audio and vinyl, and hardware teardowns — landscape and wildlife photography across British Columbia and Eastern Ontario, plus analog audio signal chains and component-level repair.',
  )

  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  // Anything unrecognised falls back rather than rendering an empty panel, so a
  // stale or hand-edited ?tab= still shows something.
  const active = TABS.some((t) => t.id === requested) ? requested : DEFAULT_TAB

  const tabRefs = useRef([])
  const firstRender = useRef(true)

  // Switching tabs replaces the whole panel. Without this, jumping from deep in
  // the 82-photo grid to the shorter audio panel leaves you scrolled past its
  // end. Skipped on first render so a shared ?tab= link does not fight the
  // router's own scroll restoration.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [active])

  const select = (id) => {
    setParams(id === DEFAULT_TAB ? {} : { tab: id })
  }

  // APG tabs: arrows move between tabs, Home/End jump to the ends. Without this
  // a keyboard user can reach the tablist but not the other tab.
  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.id === active)
    let next = null
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    if (e.key === 'ArrowLeft')  next = (i - 1 + TABS.length) % TABS.length
    if (e.key === 'Home')       next = 0
    if (e.key === 'End')        next = TABS.length - 1
    if (next === null) return
    e.preventDefault()
    select(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      {/* ── Header ── */}
      <section className="px-5 pt-12 pb-0 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40">
        <PageHeader
          eyebrow="Outside engineering"
          title="Hobbies"
          intro="Photography, hi-fi audio and vinyl, and the hardware I pull apart on weekends. None of it is professional work — it is where the same curiosity goes when there is no specification to meet."
        />

        {/* ── Tabs ── */}
        <div
          role="tablist"
          aria-label="Hobbies sections"
          onKeyDown={onKeyDown}
          className="flex flex-wrap gap-2 mb-10"
        >
          {TABS.map((t, i) => {
            const isActive = t.id === active
            return (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[i] = el }}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(t.id)}
                className="font-mono-data text-sm px-4 py-2 rounded-lg transition-colors duration-150"
                style={{
                  color:      isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: isActive ? 'var(--bg-surface-2)'  : 'transparent',
                  border:     `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border)'}`,
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Panel ── */}
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
      >
        <ErrorBoundary label={active === 'photography' ? 'Photo Gallery' : 'Audio & Workshop'}>
          <Suspense fallback={<SectionFallback />}>
            {active === 'photography' ? <PhotoGallery /> : <AudioPanel />}
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="h-6" />
    </>
  )
}
