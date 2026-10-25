import { useState } from 'react'
import { archiveData } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc } from '../../utils/thumbs'
import { gridColsFor } from '../../utils/gridCols'
import Picture from '../ui/Picture'

// ─── Image card ───────────────────────────────────────────────────────────────
/* Photograph in a recessed window, caption on the panel beneath it. Nothing is
   drawn over the picture. A real <button>, so the photo opens from the
   keyboard as well as the mouse. */
function ArchiveImage({ image }) {
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={`Open ${image.label} full size`}
        onClick={() => setLightbox(true)}
        className="panel flex flex-col overflow-hidden text-left w-full cursor-zoom-in"
      >
        {/* Spans, not divs/ps: a button may only contain phrasing content. */}
        <span className="panel-recessed block p-1 m-2 mb-0">
          <span className="block overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <Picture
              src={thumbSrc(image.src)}
              loading="lazy"
              decoding="async"
              alt={image.label}
              className="w-full h-full object-cover"
              /* objectPosition top: several of these are PORTRAIT photos (the hi-fi
                 rack, the headphone, the GPU) shown in a 4:3 landscape box. Centred
                 cover-cropping sliced out the vertical middle -- for the rack that
                 meant a band of bare shelf with the turntable cropped away, which
                 read as if the photo were rotated. Anchoring to the top keeps the
                 subject, which in every one of these shots sits at the top. */
              style={{ objectPosition: 'top' }}
            />
          </span>
        </span>
        <span className="block px-3 pt-2.5 pb-3 flex-1">
          <span className="block font-mono-data text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{image.label}</span>
          <span className="block font-mono-data mt-0.5" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{image.caption}</span>
        </span>
      </button>

      {lightbox && <ImageLightbox src={image.src} label={image.label} caption={image.caption} onClose={() => setLightbox(false)} />}
    </>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ArchiveModule({ mod }) {
  return (
    <div className="mb-10">
      {/* Module header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="legend legend-rule flex-1 legend-module">
          <span aria-hidden="true" className="material-symbols-rounded text-sm">{mod.icon}</span>
          {mod.title}
        </h2>
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{mod.spec}</span>
      </div>
      <p className="font-mono-data text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {mod.descriptor}
      </p>

      {/* Image grid */}
      {/* Single column under 480px. At 2 columns a phone card is ~182x136, which
          is too small for a label plus a full caption.
          Above that, columns are capped to the number of images, and the width
          capped with them, for the reason given in utils/gridCols: these
          modules hold one or two photos each, and a lone thumbnail in a
          four-column track reads as a grid that failed to fill. The repairs
          above are a service log rather than a grid (HardwareDiagnostics);
          these stay a grid because here the photograph is the whole entry. */}
      <div className={`grid gap-3 ${gridColsFor(mod.images.length, 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}`}>
        {mod.images.map((img) => (
          <ArchiveImage key={img.src} image={img} />
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ArchiveModules() {
  return (
    <section className="relative z-10 px-5 py-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      {archiveData.map((mod) => (
        <ArchiveModule key={mod.id} mod={mod} />
      ))}
    </section>
  )
}
