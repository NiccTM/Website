import { useState } from 'react'
import { waterSenseAerospace as data } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'
import { thumbSrc } from '../../utils/thumbs'
import Picture from '../ui/Picture'

function DigitalTwinPanel({ src, label, caption, icon }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={`Open ${label} full size`}
        className="panel flex flex-col overflow-hidden group cursor-zoom-in text-left w-full"
        onClick={() => src && setOpen(true)}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--display-bg)', aspectRatio: '4/3', minHeight: '160px' }}
        >
          {src ? (
            <>
              <Picture src={thumbSrc(src)} alt={label} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.style.opacity = '0' }} />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(0,20,60,0.35)' }}
              >
                <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: 'var(--accent)' }}>zoom_in</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-30">
              <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: 'var(--accent)' }}>{icon}</span>
              <span className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
            </div>
          )}
        </div>
        {/* Theme tokens, not white -- this block sits on the panel, not on the
            photograph above it, so in light mode white measured 1.34:1 and
            1.25:1 against a 4.5 requirement. */}
        <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--seam)' }}>
          <p className="legend" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {/* --text-secondary, not --text-muted. This panel is a 22% WHITE
              overlay, so in dark mode it composites to a mid grey that is
              lighter than the page, and the muted purple only reached 2.96:1 on
              it. MotorLab's equivalent panel is 4% white and muted is fine
              there -- the token has to suit the surface, not the component. */}
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{caption}</p>
        </div>
      </button>

        {open && <ImageLightbox src={src} label={label} caption={caption} onClose={() => setOpen(false)} />}

    </>
  )
}

export default function WaterSenseDive() {
  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-3">
        <h2 className="legend legend-rule flex-1 min-w-[16rem] legend-module">
          {data.title}
        </h2>
        <span className="legend" style={{ color: 'var(--text-muted)' }}>{data.team}</span>
      </div>

      <p
        className="mb-5 max-w-[68ch]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {data.application}
      </p>

      {/* Side-by-side: Schematic + PCB */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <DigitalTwinPanel
          src={data.images.schematic.src}
          label={data.images.schematic.label}
          caption={data.images.schematic.caption}
          icon="schema"
        />
        <DigitalTwinPanel
          src={data.images.pcb.src}
          label={data.images.pcb.label}
          caption={data.images.pcb.caption}
          icon="developer_board"
        />
      </div>

      {/* Specs */}
      <dl className="spec-grid">
        {data.technicalSpecs.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
