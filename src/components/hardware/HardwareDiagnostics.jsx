import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { hardwareDiagnostics } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc } from '../../utils/thumbs'
import Picture from '../ui/Picture'
import { serviceEntries } from '../../utils/serviceLog'

/* A service log, not a tile grid.

   This section used to open the page on five equal teardown tiles -- the
   closest thing on the site to a stock portfolio grid -- and the part worth
   reading, each repair's note (what the fault was, what was done, and why that
   order or that material), was only reachable by opening a photo. Three of the
   five tiles carried word-for-word the same caption and note, because the work
   was the same.

   So each repair is now one ruled entry: its photographs on the left, the work
   done and the note on the right, in the open. Consecutive photos whose note
   is identical are one job and share one entry, which is exactly what that
   note says ("one of three mid-range laptops ... given the same job"). Nothing
   is rewritten: every word comes from config.hardwareDiagnostics. */

// ─── Photograph window ──────────────────────────────────────────────────────
/* Every photo opens full size in the lightbox, including the CD player's: the
   way to its write-up is the labelled key in the text column, so a photo never
   behaves differently from its neighbours. */
function PhotoWindow({ image, labelled, eager, priority, deferred = false, onSettled }) {
  const [lightbox, setLightbox] = useState(false)
  const boxRef = useRef(null)
  /* A lead photo that finished before hydration fired its load event before
     React was listening, so check once on mount as well. */
  useEffect(() => {
    if (onSettled && boxRef.current?.querySelector('img')?.complete) onSettled()
  }, [onSettled])
  return (
    <>
      <button
        type="button"
        aria-label={`Open ${image.label} full size`}
        onClick={() => setLightbox(true)}
        className="block w-full text-left cursor-zoom-in service-photo"
      >
        {/* Spans, not divs: this is the content of a <button>. */}
        <span className="panel-recessed block p-1">
          <span ref={boxRef} className="block overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {!deferred && <Picture
              src={thumbSrc(image.src)}
              alt={image.label}
              /* The first entry's photo is in the first screen at every width
                 and is the route's LCP candidate on a phone; lazy-loading it
                 delayed LCP from 1.39 s to 2.65 s when these were tiles. The
                 first entry loads eagerly and its first photo is prioritised.
                 Everything below stays lazy, and waits for this one (see the
                 load-order note above HardwareDiagnostics). */
              loading={eager ? 'eager' : 'lazy'}
              fetchpriority={priority ? 'high' : 'auto'}
              decoding="async"
              className="w-full h-full object-cover"
              /* Two of these are portrait (the RTX 3090, the Beats headphone) in
                 a 4:3 box; centred cover-cropping cut the subject out. */
              style={{ objectPosition: 'top' }}
              onLoad={onSettled}
              onError={onSettled}
            />}
          </span>
        </span>
        {/* In a shared entry the title lists several devices, so each window
            names its own. A single photo needs no label: the title is it. */}
        {labelled && (
          <span className="legend block mt-1.5" style={{ color: 'var(--text-muted)' }}>{image.label}</span>
        )}
      </button>
      {lightbox && <ImageLightbox src={image.src} label={image.label} caption={image.caption} note={image.note} onClose={() => setLightbox(false)} />}
    </>
  )
}

// ─── One repair ─────────────────────────────────────────────────────────────
function LogEntry({ entry, first, deferred, onLeadSettled }) {
  const { images, note } = entry
  const shared = images.length > 1
  // Photos that share a note share a caption too (tests/data.test.mjs), so
  // the lead's caption is the whole job's work line.
  const work = images[0].caption
  const record = images.find((i) => i.to)
  /* Source order: heading and text, then the photos, then the Service
     record key. A screen reader or a heading jump meets the device before its
     photo buttons, and the Tab order (photo, then key) matches what is on
     screen, where grid areas put the photos first (or left) and the key under
     the text. Moving the photos with `order` alone put the key ahead of the
     photo it sits beside. A shared entry stacks until xl, so its strip of three is not
     squeezed into a third of the row; an entry with no note gets a narrower
     photo, so the photo does not stand three times taller than its text. */
  const variant = shared ? ' service-entry-shared' : note ? '' : ' service-entry-brief'
  return (
    <li className={`service-entry${variant}`}>
      <div className="service-text min-w-0">
        <h4 className="font-display font-bold leading-snug" style={{ color: 'var(--text-primary)', fontSize: 'clamp(1rem, 0.92rem + 0.35vw, 1.2rem)' }}>
          {images.map((i) => i.label).join(' · ')}
        </h4>
        {/* Legend in its own column, so a long work line wraps under itself
            and never pushes the legend onto a line of its own. */}
        <p className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3">
          <span className="legend" style={{ color: 'var(--text-muted)' }}>Work</span>
          <span className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>{work}</span>
        </p>
        {note && <p className="service-note">{note}</p>}
      </div>
      <div className="service-photos" style={{ '--n': images.length }}>
        {images.map((img, i) => (
          <PhotoWindow
            key={img.src}
            image={img}
            labelled={shared}
            eager={first}
            priority={first && i === 0}
            deferred={deferred}
            onSettled={first && i === 0 ? onLeadSettled : undefined}
          />
        ))}
      </div>
      {record && (
        <div className="service-actions">
          <Link to={record.to} className="key key-sm">
            Service record<span className="sr-only">: {record.label}</span>
            <span aria-hidden="true" className="material-symbols-rounded text-sm">chevron_right</span>
          </Link>
        </div>
      )}
    </li>
  )
}

// ─── Category ───────────────────────────────────────────────────────────────
function CategorySection({ category, first = false, leadSettled, onLeadSettled }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h3 className="legend legend-rule flex-1 legend-module">
          {category.icon === '_sacd'
            ? <span aria-hidden="true" className="font-readout font-bold">SACD</span>
            : <span aria-hidden="true" className="material-symbols-rounded text-sm">{category.icon}</span>
          }
          {category.label}
        </h3>
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{category.description}</span>
      </div>
      <ul className="service-log">
        {serviceEntries(category.images).map((entry, i) => (
          <LogEntry
            key={entry.images[0].src}
            entry={entry}
            first={first && i === 0}
            deferred={!(first && i === 0) && !leadSettled}
            onLeadSettled={onLeadSettled}
          />
        ))}
      </ul>
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────
/* Load order. The first entry's photo is the route's LCP element at every
   width. On a throttled link the log's other photos, inside the browser's
   lazy-load margin, were downloading alongside it: with them blocked, desktop
   LCP fell from about 2.6 s to 1.85 s over HTTP/1.1 and from 2.1 s to 1.65 s
   over HTTP/2 (DESIGN-EVOLUTION section 15). So the other photos are not put
   in the page until the lead photo has loaded or failed; then they load
   lazily as before. Their windows keep the 4:3 box meanwhile, so nothing
   moves, and the server-rendered page and the first client render agree
   (both start with only the lead photo). */
export default function HardwareDiagnostics() {
  const [leadSettled, setLeadSettled] = useState(false)
  const onLeadSettled = useCallback(() => setLeadSettled(true), [])
  return (
    <section
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* The boxed "spec" chip that sat opposite this heading is gone: it
          restated the descriptor beneath the title in other words. */}
      <div className="mb-6">
        <h2 className="legend legend-module">
          {hardwareDiagnostics.title}
        </h2>
        <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
          {hardwareDiagnostics.descriptor}
        </p>
      </div>

      {hardwareDiagnostics.categories.map((cat, i) => (
        <CategorySection key={cat.key} category={cat} first={i === 0} leadSettled={leadSettled} onLeadSettled={onLeadSettled} />
      ))}
    </section>
  )
}
