import { Suspense, useRef, useEffect } from 'react'
import { lazyWithReload } from '../utils/lazyWithReload'
import { useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import PageHeader from '../components/layout/PageHeader'
import HeaderPlate from '../components/layout/HeaderPlate'
import { hardwareDiagnostics, audioChain } from '../data/config'
import { serviceEntries } from '../utils/serviceLog'
import WhenVisible from '../components/ui/WhenVisible'
import ErrorBoundary from '../components/ui/ErrorBoundary'

/* /photography and /archive used to be two separate nav items. They are the
   same kind of thing -- what I do outside engineering -- so they are one route
   with two tabs. Both panels stay lazy: the photo grid is 82 images and the
   signal chains pull in React Flow, and nobody should pay for the tab they did
   not open. */
const PhotoGallery        = lazyWithReload(() => import('../components/photography/PhotoGallery'))
const HardwareDiagnostics = lazyWithReload(() => import('../components/hardware/HardwareDiagnostics'))
const ArchiveModules      = lazyWithReload(() => import('../components/hardware/ArchiveModules'))
const AudioSignalChain    = lazyWithReload(() => import('../components/diagrams/AudioSignalChain'))
const VinylArchive        = lazyWithReload(() => import('../components/audio/VinylArchive'))

const TABS = [
  { id: 'audio',       label: 'Audio & Workshop' },
  { id: 'photography', label: 'Photography' },
]
/* First tab is also the one /hobbies opens on -- a tab order that does not
   match what loads by default reads as a bug. Photography therefore has to be
   an explicit ?tab=, which is why the links that used to point at
   /photography carry it. */
const DEFAULT_TAB = 'audio'

/* Logbook plate. Hobbies is the one route whose header gets a recessed plate:
   the page is a collection of unrelated things (repairs, listening rooms,
   records, photographs), and a logbook is the honest summary of that. Counts
   come from the same data the sections render. Repairs are counted the way
   the service log shows them -- entries, with the photographs beside -- so
   the plate cannot say 8 over a log of 6. */
const SERVICE_RECORDS = hardwareDiagnostics.categories.reduce((n, c) => n + serviceEntries(c.images).length, 0)
const REPAIR_PHOTOS = hardwareDiagnostics.categories.reduce((n, c) => n + c.images.length, 0)
const LOGBOOK = [
  /* Each count stays with its noun, so a narrow plate breaks at the middot
     rather than stranding the "8" from "photographs". */
  { label: 'Repairs', value: <><span className="whitespace-nowrap">{SERVICE_RECORDS} service records</span> · <span className="whitespace-nowrap">{REPAIR_PHOTOS} photographs</span></> },
  { label: 'Listening rooms', value: audioChain.rooms.length },
  { label: 'Vinyl', value: 'Discogs collection' },
  { label: 'CD player', value: 'Service record', to: '/hobbies/cd-player' },
]

function SectionFallback() {
  return (
    <div className="px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      <div className="h-64 panel-recessed animate-pulse" />
    </div>
  )
}

function Divider() {
  return (
    <div className="px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
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
      {/* Both are below the fold, and lazy() alone does not defer the fetch --
          mounting a lazy component on first render downloads its chunk right
          away. The signal chains pull React Flow (~43 KB gzip) and the vinyl
          archive fetches the Discogs collection and 50 sleeves, all of it
          competing with the top of the page, whose LCP is a paragraph of text
          held up behind exactly this kind of contention. */}
      <ErrorBoundary label="Audio Signal Chains">
        <WhenVisible>
          <AudioSignalChain sectionId="section-audio" />
        </WhenVisible>
      </ErrorBoundary>
      <Divider />
      <ErrorBoundary label="Vinyl Archive">
        <WhenVisible>
          <VinylArchive />
        </WhenVisible>
      </ErrorBoundary>
    </>
  )
}

export default function HobbiesPage() {
  usePageMeta(
    'Hobbies',
    'Photography, hi-fi audio and vinyl, and hardware teardowns. Landscape and wildlife photography across British Columbia and Eastern Ontario, plus analog audio signal chains and component-level repair.',
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
      <section className="px-5 pt-12 pb-0 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
        <PageHeader
          eyebrow="Outside engineering"
          title="Hobbies"
          intro="Photography, hi-fi audio and vinyl, and the hardware I pull apart on weekends. None of it is professional work. It is where the same curiosity goes when there is no specification to meet."
          plateFrom="lg"
          plate={<HeaderPlate legend="Logbook" label="Hobbies logbook" rows={LOGBOOK} />}
        >
          {/* ── Tabs ── (inside the header, so they sit beside the logbook) */}
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
                  /* A source-selector key: latched (depressed, lamp lit) when it
                     is the selected tab. The latch is drawn from aria-selected,
                     so the visual state is the accessible state. */
                  className="key"
                >
                  <span aria-hidden="true" className={`lamp${isActive ? ' lamp-ok' : ''}`} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </PageHeader>
      </section>

      {/* ── Panel ──
          The four Audio & Workshop sections each carry py-10, which is the
          right rhythm between them and 40px too much on the first one: it
          stacked on the tablist's own margin and left an 80px hole under the
          tabs, against 48px on the Photography tab, so the same page had two
          different openings depending on which tab you were on. Overriding
          only the first section keeps the spacing between sections intact.
          Photography already opens at pt-2, so this is a no-op there. */}
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
        className="[&>section:first-of-type]:pt-2"
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
