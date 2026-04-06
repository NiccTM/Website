import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ImageLightbox from '../ui/ImageLightbox'

// ─── Challenge / Solution card data ───────────────────────────────────────────
const CHALLENGES = [
  {
    id: 'reluctance',
    icon: 'hub',
    title: 'Magnetic Reluctance Optimization',
    challenge:
      'PLA stator teeth have a relative permeability of ≈ 1 — effectively air. High reluctance limited flux density and produced insufficient torque at target RPM.',
    solution:
      'Replaced PLA teeth with iron bolts (μᵣ ≈ 200). The ferromagnetic path concentrates magnetic flux through the air gap, significantly increasing torque density without a winding change.',
    metric: 'μᵣ: 1 → ~200',
  },
  {
    id: 'thermal',
    icon: 'thermostat',
    title: 'Thermal & Material Pivot',
    challenge:
      'Resistive heating under the 30A ESC draw brought winding temperatures near the PLA+ glass transition (Tg ≈ 55°C), risking dimensional deformation of the stator and rotor housing.',
    solution:
      'Upgraded both the base and rotor to PETG HF (Tg ≈ 70°C). PETG HF maintains geometry under sustained thermal load and offers superior layer adhesion for press-fit magnet pockets.',
    metric: 'Tg: 55°C → 70°C',
  },
  {
    id: 'commutation',
    icon: 'electric_bolt',
    title: 'Commutation Alignment',
    challenge:
      'Initial ABCABCABC winding distributed opposing magnetic polarities across adjacent teeth, causing torque cancellation and low-speed oscillation that prevented clean spin-up.',
    solution:
      'Implemented AaABbBCCC winding sequence — grouping same-phase poles to unify magnetic torque vectoring across the air gap, eliminating cancellation and producing smooth commutation.',
    metric: 'ABCABCABC → AaABbBCCC',
  },
]

// ─── Card ─────────────────────────────────────────────────────────────────────
function ChallengeCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.38, ease: 'easeOut', delay: index * 0.08 }}
      className="flex flex-col gap-4 p-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,229,255,0.12)',
        borderRadius: 'var(--radius)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-rounded text-xl shrink-0 mt-0.5"
          style={{ color: 'var(--accent)' }}
        >
          {item.icon}
        </span>
        <div className="min-w-0">
          <h4
            className="font-sans text-sm font-semibold leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.title}
          </h4>
          <span
            className="font-mono-data text-sm mt-0.5 inline-block"
            style={{ color: 'var(--accent)' }}
          >
            {item.metric}
          </span>
        </div>
      </div>

      {/* Challenge */}
      <div
        className="rounded px-3 py-2.5"
        style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.20)' }}
      >
        <p
          className="font-mono-data text-sm mb-1 tracking-wider uppercase"
          style={{ color: '#FF3B30' }}
        >
          Challenge
        </p>
        <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.challenge}
        </p>
      </div>

      {/* Solution */}
      <div
        className="rounded px-3 py-2.5"
        style={{ background: 'rgba(88,184,224,0.06)', border: '1px solid rgba(88,184,224,0.20)' }}
      >
        <p
          className="font-mono-data text-sm mb-1 tracking-wider uppercase"
          style={{ color: 'var(--accent)' }}
        >
          Solution
        </p>
        <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.solution}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Digital Twin image pair ──────────────────────────────────────────────────
function DigitalTwinPanel({ src, label, caption, icon }) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="flex flex-col overflow-hidden cursor-zoom-in group"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 'var(--radius)' }}
        onClick={() => src && setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(2,13,26,0.6)', aspectRatio: '4/3', minHeight: '160px' }}
        >
          {src ? (
            <>
              <img
                src={src}
                alt={label}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                style={{ background: 'rgba(3,7,18,0.45)', opacity: hovered ? 1 : 0 }}
              >
                <span className="material-symbols-rounded text-3xl" style={{ color: 'var(--accent)' }}>zoom_in</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-30">
              <span className="material-symbols-rounded text-3xl" style={{ color: 'var(--accent)' }}>{icon}</span>
              <span className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2">
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

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MotorLab() {
  return (
    <div className="mt-10">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 mb-6"
      >
        <span className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>settings</span>
        <h3
          className="font-mono-data text-base tracking-widest uppercase"
          style={{ color: 'var(--accent)' }}
        >
          BLDC Motor — Technical Deep Dive
        </h3>
        <div className="flex-1 h-px ml-2" style={{ background: 'rgba(0,229,255,0.12)' }} />
        <span className="font-mono-data text-sm" style={{ color: 'var(--text-muted)' }}>
          $94.92 / $100 CAD
        </span>
      </motion.div>

      {/* Digital Twin: CAD cross-section + physical prototype */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <DigitalTwinPanel
          src="/motor-cad.gif"
          label="CAD Cross-Section"
          caption="9-pole stator · 16-pole rotor · Wye winding geometry"
          icon="view_in_ar"
        />
        <DigitalTwinPanel
          src="/motor-proto.jpg"
          label="Physical Prototype"
          caption="PETG HF housing · Iron bolt stator teeth · 24 AWG windings"
          icon="precision_manufacturing"
        />
      </div>

      {/* Full-width motor demo video */}
      <div
        className="overflow-hidden mb-6"
        style={{ background: 'rgba(2,13,26,0.6)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 'var(--radius)' }}
      >
        <video
          src="/motor_cmp.mp4"
          controls
          loop
          playsInline
          className="w-full block"
          style={{ maxHeight: '420px', objectFit: 'cover' }}
        />
        <div className="px-3 py-2">
          <p className="font-mono-data text-sm font-medium" style={{ color: '#ffffff' }}>Motor Demo</p>
          <p className="font-mono-data text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>First spin-up — AaABbBCCC winding sequence · Hobbywing Skywalker 30A V2 ESC</p>
        </div>
      </div>

      {/* Challenge / Solution cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CHALLENGES.map((item, i) => (
          <ChallengeCard key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Spec footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex flex-wrap gap-x-6 gap-y-2 mt-5"
      >
        {[
          { label: 'Topology',  value: '9S / 16P Inrunner' },
          { label: 'Winding',   value: '~200 T/pole · 24 AWG' },
          { label: 'Rₚₕ',       value: '~2.022 Ω' },
          { label: 'Control',   value: 'Arduino + Hobbywing 30A' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="font-mono-data text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
            <span className="font-mono-data text-sm" style={{ color: 'var(--accent)' }}>{value}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
