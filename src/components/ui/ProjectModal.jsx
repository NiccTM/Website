import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

function SubSystemImage({ src, label, caption }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: 'var(--bg-surface-2)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '12px',
        transition: 'border-color 0.18s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-surface-3)' }}>
        <img
          src={src}
          alt={label}
          className="w-full h-full object-cover"
          style={{
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.25s',
          }}
        />
      </div>
      <div className="px-2.5 py-2">
        <p className="font-mono-data text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="font-mono-data mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{caption}</p>
      </div>
    </div>
  )
}

function SubSystemSection({ sys }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>{sys.icon}</span>
        <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: 'var(--accent)' }}>{sys.title}</p>
        <div className="flex-1 h-px ml-1" style={{ background: 'var(--border)' }} />
      </div>
      <p className="font-sans text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {sys.description}
      </p>
      {sys.images.length > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(sys.images.length, 3)}, 1fr)` }}
        >
          {sys.images.map((img) => (
            <SubSystemImage key={img.src} src={img.src} label={img.label} caption={img.caption} />
          ))}
        </div>
      )}
    </div>
  )
}

const AWARD_STYLES = {
  gold:     { bg: 'rgba(255,215,0,0.10)',  border: 'rgba(255,215,0,0.40)',  text: '#FFD700', icon: 'emoji_events' },
  bronze:   { bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.40)', text: '#CD7F32', icon: 'military_tech' },
  cyan:     { bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.35)',  text: 'var(--accent)', icon: 'stars' },
  practice: { bg: 'rgba(0,229,255,0.06)',  border: 'rgba(0,229,255,0.25)',  text: 'var(--accent)', icon: 'gavel' },
}

export default function ProjectModal({ project, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { expandedDetails, awards = [] } = project
  const { extendedDescription = '', technicalSpecs = [], subSystems = [], links = [] } = expandedDetails ?? {}
  const paragraphs = Array.isArray(extendedDescription)
    ? extendedDescription
    : extendedDescription.split('\n\n').filter(Boolean)

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(3,2,10,0.80)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', willChange: 'opacity' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        exit={{    scale: 0.94, y: 20, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-2xl flex flex-col"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--glass-outer)',
          maxHeight: 'calc(100vh - 4rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* â”€â”€ Header â”€â”€ */}
        <div
          className="flex items-start justify-between gap-4 px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            {project.course && (
              <p className="font-mono-data text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                {project.course}
              </p>
            )}
            <h2 className="font-sans text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {project.title}
            </h2>
            {awards.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {awards.map((award) => {
                  const s = AWARD_STYLES[award.tier] ?? AWARD_STYLES.cyan
                  return (
                    <span
                      key={award.id}
                      className="inline-flex items-center gap-1 font-mono-data px-2 py-0.5 text-xs border"
                      style={{ background: s.bg, borderColor: s.border, color: s.text, borderRadius: '8px' }}
                    >
                      <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '0.875rem' }}>{s.icon}</span>
                      {award.label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            aria-label="Close"
          >
            <span aria-hidden="true" className="material-symbols-rounded text-base">close</span>
          </button>
        </div>

        {/* â”€â”€ Scrollable body â”€â”€ */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">

          {/* Description */}
          {paragraphs.length > 0 && (
            <div className="flex flex-col gap-3">
              {paragraphs.map((p, i) => (
                <p key={i} className="font-sans text-base leading-relaxed" style={{ color: 'var(--text-primary)', maxWidth: 'none' }}>
                  {p}
                </p>
              ))}
            </div>
          )}

          {/* Technical Specs */}
          {technicalSpecs.length > 0 && (
            <div>
              <p className="font-mono-data text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
                Technical Specs
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {technicalSpecs.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="flex gap-4 px-4 py-2.5"
                    style={{
                      background: i % 2 === 0 ? 'var(--bg-surface-2)' : 'transparent',
                      borderBottom: i < technicalSpecs.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span className="font-mono-data text-sm shrink-0 w-36" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                    <span className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Systems */}
          {subSystems.length > 0 && (
            <div className="flex flex-col gap-5">
              <p className="font-mono-data text-xs tracking-widest uppercase -mb-2" style={{ color: 'var(--accent)' }}>
                Hardware Integration
              </p>
              {subSystems.map((sys) => (
                <SubSystemSection key={sys.id} sys={sys} />
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono-data px-2 py-0.5 rounded text-sm"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-3)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* â”€â”€ Footer links â”€â”€ */}
        {(links.length > 0 || project.github) && (
          <div
            className="flex flex-wrap gap-3 px-6 py-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {links.length > 0
              ? links.map(({ label, url, icon }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono-data text-sm px-3 py-2 rounded-lg transition-colors duration-150"
                    style={{ color: 'var(--accent)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
                  >
                    <span aria-hidden="true" className="material-symbols-rounded text-sm">{icon ?? 'open_in_new'}</span>
                    {label}
                  </a>
                ))
              : project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono-data text-sm px-3 py-2 rounded-lg transition-colors duration-150"
                    style={{ color: 'var(--accent)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
                  >
                    <span aria-hidden="true" className="material-symbols-rounded text-sm">open_in_new</span>
                    GitHub
                  </a>
                )}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}
