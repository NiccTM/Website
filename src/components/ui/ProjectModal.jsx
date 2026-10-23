import { useEffect, useState } from 'react'
import { useDialog } from '../../hooks/useDialog'
import { createPortal } from 'react-dom'
import { thumbSrc } from '../../utils/thumbs'
import Picture from './Picture'
import ImageLightbox from './ImageLightbox'
import ProjectAward from './ProjectAward'

function SubSystemImage({ src, label, caption, onOpen }) {
  return (
    <button
      type="button"
      aria-label={`Open ${label} full size`}
      className="panel flex flex-col overflow-hidden cursor-zoom-in text-left w-full"
      onClick={() => onOpen?.({ src, label, caption })}
    >
      <div className="panel-recessed p-1 m-1.5 mb-0">
        <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
          <Picture
            src={thumbSrc(src)}
            alt={label}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            style={{
              // Anchor to the top: many of these are tall dashboard captures, and
              // the header/metrics at the top read better in a 4:3 tile than the
              // vertical middle object-cover would otherwise show.
              objectPosition: 'top',
            }}
          />
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="font-mono-data text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="font-mono-data mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{caption}</p>
      </div>
    </button>
  )
}

function SubSystemSection({ sys, onOpen }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--text-muted)' }}>{sys.icon}</span>
        <p className="legend legend-rule flex-1" style={{ color: 'var(--text-muted)' }}>{sys.title}</p>
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
            <SubSystemImage key={img.src} src={img.src} label={img.label} caption={img.caption} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectModal({ project, onClose }) {
  const dialogRef = useDialog()
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

  const [shot, setShot] = useState(null)   // sub-system image opened in the lightbox

  const { expandedDetails, awards = [] } = project
  const {
    extendedDescription = '', technicalSpecs = [], subSystems = [], links = [],
    // Label above the screenshot grid. Defaults to the original hardware wording;
    // software projects override it (e.g. "Interface").
    subSystemsLabel = 'Hardware Integration',
  } = expandedDetails ?? {}
  const paragraphs = Array.isArray(extendedDescription)
    ? extendedDescription
    : extendedDescription.split('\n\n').filter(Boolean)

  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(12,12,10,0.82)', willChange: 'opacity' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* The trap goes on the PANEL, not the backdrop: the backdrop is
          click-to-close and must stay outside the dialog's focus scope. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={project?.title || 'Project details'}
        className="panel anim-pop relative w-full max-w-2xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between gap-4 px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--seam)' }}
        >
          <div className="min-w-0">
            {project.course && (
              <p className="legend mb-1" style={{ color: 'var(--text-muted)' }}>
                {project.course}
              </p>
            )}
            <h2 className="font-display text-xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {project.title}
            </h2>
            {awards.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {awards.map((award) => <ProjectAward key={award.id} award={award} />)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="key key-sm shrink-0"
            aria-label="Close"
          >
            <span aria-hidden="true" className="material-symbols-rounded text-base">close</span>
          </button>
        </div>

        {/* ── Scrollable body ── */}
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
              <h3 className="legend legend-rule mb-3" style={{ color: 'var(--text-muted)' }}>
                Technical Specs
              </h3>
              <dl className="spec-grid text-sm">
                {technicalSpecs.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Sub-Systems */}
          {subSystems.length > 0 && (
            <div className="flex flex-col gap-5">
              <h3 className="legend legend-rule -mb-2" style={{ color: 'var(--text-muted)' }}>
                {subSystemsLabel}
              </h3>
              {subSystems.map((sys) => (
                <SubSystemSection key={sys.id} sys={sys} onOpen={setShot} />
              ))}
            </div>
          )}

          {/* Tags */}
          <ul className="flex flex-wrap gap-1.5 list-none">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="font-mono-data px-2 py-0.5 text-sm"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--panel-plate)',
                  border: '1px solid var(--seam)',
                  borderRadius: '2px',
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Footer links ── */}
        {(links.length > 0 || project.github) && (
          <div
            className="flex flex-wrap gap-3 px-6 py-4"
            style={{ borderTop: '1px solid var(--seam)' }}
          >
            {links.length > 0
              ? links.map(({ label, url, icon }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="key key-sm"
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
                    className="key key-sm"
                  >
                    <span aria-hidden="true" className="material-symbols-rounded text-sm">open_in_new</span>
                    GitHub
                  </a>
                )}
          </div>
        )}
      </div>

      {/* Screenshot lightbox -- opened from a sub-system image. Stops the click
          from bubbling to the backdrop (which would close the whole modal). */}
      {shot && (
        <div onClick={(e) => e.stopPropagation()}>
          <ImageLightbox
            src={shot.src}
            label={shot.label}
            caption={shot.caption}
            onClose={() => setShot(null)}
          />
        </div>
      )}
    </div>,
    document.body
  )
}
