import { useState } from 'react'
import { Link } from 'react-router-dom'
import { hardwareDiagnostics } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc } from '../../utils/thumbs'
import { gridColsFor } from '../../utils/gridCols'
import Picture from '../ui/Picture'

// ─── Image card ──────────────────────────────────────────
/* Most tiles open their own photo in the lightbox, because the photo IS the
   content. A tile carrying `to` is a doorway to a full write-up instead, so it
   navigates on click and says so on its face -- a tile that behaves differently
   from its neighbours has to announce that before the click, not after it.

   The caption sits BELOW the photograph, on the panel, rather than over it on
   a gradient. These captions run 80-95 characters and used to need a scrim
   that grew with the text; a caption beside the picture needs no scrim and
   leaves the photograph untouched. */
function DiagnosticImage({ image, eager = false, priority = false }) {
  const [lightbox, setLightbox] = useState(false)
  const linked = Boolean(image.to)

  const shellClass = `panel flex flex-col overflow-hidden text-left w-full ${linked ? 'cursor-pointer' : 'cursor-zoom-in'}`

  const inner = (
    <>
      {/* Spans, not divs/ps: this markup is the content of a <button> (or a
          link), and a button may only contain phrasing content. */}
      <span className="panel-recessed block p-1 m-2 mb-0">
        <span className="block overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <Picture
            src={thumbSrc(image.src)}
            alt={image.label}
            /* The first tiles sit inside the first screen on a phone, and the
               first one is the route's LCP element there (measured: 344x258
               at y=712 in a 412x823 viewport, larger than the intro text).
               Lazy-loading it delayed LCP from 1.39s to 2.65s, so the leading
               tiles load eagerly and the very first is prioritised. Everything
               below stays lazy. */
            loading={eager ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="w-full h-full object-cover"
            /* Three of these are portrait (the hi-fi rack, the RTX 3090, the
               Beats headphone) rendered into a 4:3 landscape box. Centred
               cover-cropping cut the subject out of the middle; top-anchoring
               keeps it. See ArchiveModules for the same fix. */
            style={{ objectPosition: 'top' }}
          />
        </span>
      </span>

      <span className="flex flex-col items-start gap-0.5 px-3 pt-2.5 pb-3 flex-1">
        {/* No line-clamp. These captions are terse work notes, not padding, and
            cutting one mid-item loses the last thing in a list that is nothing
            but items. The panel grows by a line instead. */}
        <span className="block font-mono-data text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{image.label}</span>
        <span className="block font-mono-data" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{image.caption}</span>
        {/* The link cue is always visible: it is the only thing saying this
            tile leaves the page, and a touch screen has no hover to reveal it. */}
        {linked && (
          <span className="key key-sm mt-2" aria-hidden="true">
            Repair log
            <span className="material-symbols-rounded text-sm">open_in_new</span>
          </span>
        )}
      </span>
    </>
  )

  if (linked) {
    return (
      <Link to={image.to} aria-label={`${image.label}: read the full repair write-up`} className={shellClass}>
        {inner}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Open ${image.label} full size`}
        onClick={() => setLightbox(true)}
        className={shellClass}
      >
        {inner}
      </button>
      {lightbox && <ImageLightbox src={image.src} label={image.label} caption={image.caption} note={image.note} onClose={() => setLightbox(false)} />}
    </>
  )
}

// ─── Category section ─────────────────────────────────────────────────────────
function CategorySection({ category, first = false }) {
  // Columns capped to the tile count; see utils/gridCols for why the width is
  // capped alongside them. ArchiveModules renders the sections directly below
  // these and uses the same helper, so a one-photo category looks the same
  // whichever component drew it.
  const gridCols = gridColsFor(
    category.images.length,
    'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  )
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="legend legend-rule flex-1 legend-module">
          {category.icon === '_sacd'
            ? <span aria-hidden="true" className="font-readout font-bold">SACD</span>
            : <span aria-hidden="true" className="material-symbols-rounded text-sm">{category.icon}</span>
          }
          {category.label}
        </h3>
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{category.description}</span>
      </div>

      <div className={`grid gap-3 ${gridCols}`}>
        {category.images.map((img, i) => (
          <DiagnosticImage key={img.src} image={img} eager={first && i < 2} priority={first && i === 0} />
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HardwareDiagnostics() {
  return (
    <section
      className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="legend legend-module">
            {hardwareDiagnostics.title}
          </h2>
          <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            {hardwareDiagnostics.descriptor}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ background: 'var(--panel-plate)', border: '1px solid var(--seam)', borderRadius: '2px' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--text-muted)' }}>build_circle</span>
          <span className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>{hardwareDiagnostics.spec}</span>
        </div>
      </div>

      {/* Categories */}
      {hardwareDiagnostics.categories.map((cat, i) => (
        <CategorySection key={cat.key} category={cat} first={i === 0} />
      ))}
    </section>
  )
}
