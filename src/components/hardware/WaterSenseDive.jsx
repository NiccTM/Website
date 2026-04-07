import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { waterSenseAerospace as data } from '../../data/config'
import ImageLightbox from '../ui/ImageLightbox'

function DigitalTwinPanel({ src, label, caption, icon }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="flex flex-col overflow-hidden group cursor-zoom-in"
        style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 'var(--radius)' }}
        onClick={() => src && setOpen(true)}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.1)', aspectRatio: '4/3', minHeight: '160px' }}
        >
          {src ? (
            <>
              <img src={src} alt={label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.style.opacity = '0' }} />
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
        <div className="px-3 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}>
          <p className="font-mono-data text-sm font-medium" style={{ color: '#ffffff' }}>{label}</p>
          <p className="font-mono-data text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{caption}</p>
        </div>
      </div>

      <AnimatePresence>
        {open && <ImageLightbox src={src} label={label} caption={caption} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

export default function WaterSenseDive() {
  return (
    <div className="mt-10">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 mb-2"
      >
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>flight</span>
        <h3 className="font-mono-data text-base tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          {data.title}
        </h3>
        <div className="flex-1 h-px ml-2" style={{ background: 'rgba(255,255,255,0.45)' }} />
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>{data.team}</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="font-sans text-sm mb-5 max-w-2xl"
        style={{ color: 'var(--text-secondary)' }}
      >
        {data.application}
      </motion.p>

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

      {/* Specs table */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.45)', borderRadius: 'var(--radius)' }}
      >
        {data.technicalSpecs.map(({ label, value }, i) => (
          <div
            key={label}
            className="flex gap-4 px-4 py-2.5"
            style={{
              background: i % 2 === 0 ? 'var(--bg-surface-2)' : 'transparent',
              borderBottom: i < data.technicalSpecs.length - 1 ? '1px solid rgba(255,255,255,0.45)' : 'none',
            }}
          >
            <span className="font-mono-data text-sm shrink-0 w-28" style={{ color: 'var(--text-muted)' }}>
              {label}
            </span>
            <span className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>
              {value}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
