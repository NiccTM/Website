import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { projects } from '../../data/config'
import ProjectModal from './ProjectModal'

// ─── Card-level hero images keyed by project id ───────────────────────────────
const PROJECT_IMAGES = {
  'bldc-motor':       '/motor-proto.jpg',
  'water-contact':    '/Water_Sense_AerospaceTeam_PCB.jpg',
  ecosort:            '/20260321_210541.jpg',
  'feeble-presence':  '/Water wavy August 9.jpg',
  'delorean-apsc171': '/DeLorean.png',
  unbox:              '/UnBox.jpg',
  firesense:          '/FireSense.jpg',
  consultation:       '/Remastered Photos/Canadian Parliament Building 1.jpg',
  whistler:           '/Remastered Photos/Kelowna Mountains.jpg',
}

// Gradient placeholders for projects without photos
const CATEGORY_GRADIENTS = {
  competitive: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  practice:    'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  software:    'linear-gradient(135deg, #0f1923 0%, #1a2e1a 100%)',
}

const AWARD_STYLES = {
  gold:     { bg: 'rgba(10,8,0,0.72)',  border: 'rgba(255,215,0,0.6)',   text: '#FFD700', icon: 'emoji_events' },
  bronze:   { bg: 'rgba(10,6,0,0.72)', border: 'rgba(205,127,50,0.6)',  text: '#CD7F32', icon: 'military_tech' },
  cyan:     { bg: 'rgba(0,8,14,0.72)', border: 'rgba(88,184,224,0.55)', text: '#58b8e0', icon: 'stars' },
  practice: { bg: 'rgba(0,8,14,0.72)', border: 'rgba(88,184,224,0.45)', text: '#58b8e0', icon: 'gavel' },
}

const SECTIONS = [
  { key: 'competitive', label: 'Competitive Design',    icon: 'emoji_events' },
  { key: 'practice',    label: 'Professional Practice', icon: 'gavel' },
  { key: 'software',    label: 'Software & Personal',   icon: 'code' },
]

function ProjectAward({ award }) {
  const style = AWARD_STYLES[award.tier] ?? AWARD_STYLES.cyan
  return (
    <span
      className="inline-flex items-center gap-1 font-mono-data px-2 py-0.5 rounded text-xs border"
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.text,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '0.875rem' }}>{style.icon}</span>
      {award.label}
    </span>
  )
}

function ProjectCard({ project, index, onExpand }) {
  const hasDetails   = !!project.expandedDetails
  const heroImage    = PROJECT_IMAGES[project.id]
  const fallbackImage = !heroImage && project.expandedDetails?.subSystems
    ?.flatMap((s) => s.images)?.[0]?.src
  const displayImage = heroImage || fallbackImage || null

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.06 }}
      onClick={hasDetails ? onExpand : undefined}
      className="glass-card card-hover-scale group relative flex flex-col overflow-hidden rounded-xl"
      style={{
        cursor: hasDetails ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
    >
      {/* ── Image area ── */}
      <div className="relative overflow-hidden" style={{ paddingTop: '62%' }}>
        {displayImage ? (
          // card-img class receives CSS transform via .card-hover-scale:hover .card-img
          <img
            src={displayImage}
            alt={project.title}
            className="card-img absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: CATEGORY_GRADIENTS[project.category] ?? CATEGORY_GRADIENTS.practice }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: '5rem', color: '#fff' }}>
                {project.icon ?? (project.category === 'competitive' ? 'emoji_events' : project.category === 'software' ? 'code' : 'gavel')}
              </span>
            </div>
          </div>
        )}

        {/* Specs overlay — CSS-driven slide-up on hover, always visible on touch */}
        <div
          className="hover-overlay absolute inset-x-0 bottom-0"
          style={{
            background: 'rgba(10,10,10,0.75)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            padding: '0.875rem',
          }}
        >
          {project.expandedDetails?.technicalSpecs?.slice(0, 3).map((s) => (
            <div key={s.label} className="flex gap-2 mb-1">
              <span className="font-mono-data shrink-0" style={{ color: '#00E5FF', minWidth: '72px', fontSize: '0.875rem' }}>
                {s.label}
              </span>
              <span className="font-mono-data" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.875rem' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Award badge */}
        {project.awards?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {project.awards.slice(0, 1).map((award) => (
              <ProjectAward key={award.id} award={award} />
            ))}
          </div>
        )}

        {/* Expand icon — always visible on touch, hover-shown on desktop */}
        {hasDetails && (
          <div className="absolute top-3 right-3">
            <span
              className="material-symbols-rounded text-sm flex items-center justify-center rounded-full"
              style={{
                color: '#58b8e0',
                background: 'rgba(10,10,10,0.65)',
                width: '32px',
                height: '32px',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              open_in_full
            </span>
          </div>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="flex flex-col gap-2 p-4">
        {project.course && (
          <p className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
            {project.course}
          </p>
        )}
        <h3 className="font-display font-bold leading-snug fluid-xl" style={{ color: 'var(--text-primary)', fontSize: 'clamp(0.95rem, 0.85rem + 0.4vw, 1.2rem)' }}>
          {project.title}
        </h3>
        <p className="font-sans leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.78rem, 0.72rem + 0.25vw, 0.9rem)' }}>
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="font-mono-data px-2 rounded"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', paddingTop: '3px', paddingBottom: '3px' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function SectionHeading({ label, icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 mb-6"
    >
      <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>{icon}</span>
      <h2
        className="font-display font-bold"
        style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.35rem, 1.1rem + 0.8vw, 2rem)' }}
      >
        {label}
      </h2>
      <div className="flex-1 h-px ml-2" style={{ background: 'var(--border)' }} />
    </motion.div>
  )
}

export default function ProjectGallery() {
  const [activeProject, setActiveProject] = useState(null)

  return (
    <section className="relative z-10 px-5 py-12 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full">
      {/* Section eyebrow */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-mono-data tracking-[0.18em] uppercase mb-4"
        style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
      >
        Selected Work
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="font-display mb-6"
        style={{ fontSize: 'clamp(2.25rem, 2rem + 2.5vw, 5rem)', color: 'var(--text-primary)', fontWeight: 900, lineHeight: 1 }}
      >
        Projects
      </motion.h1>

      <div className="flex flex-col gap-14">
        {SECTIONS.map((section, si) => {
          const sectionProjects = projects.filter((p) => p.category === section.key)
          if (!sectionProjects.length) return null
          return (
            <div key={section.key}>
              <SectionHeading label={section.label} icon={section.icon} index={si} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 tv:grid-cols-4">
                {sectionProjects.map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={i}
                    onExpand={() => setActiveProject(project)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {activeProject && (
          <ProjectModal
            key={activeProject.id}
            project={activeProject}
            onClose={() => setActiveProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
