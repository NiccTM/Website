import { motion } from 'framer-motion'
import { projects } from '../data/config'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.08 },
  }),
}

function ProjectCard({ project, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col gap-3 p-5 rounded-xl border-subtle glass cursor-default"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-sans text-sm font-medium leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {project.title}
        </h3>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} on GitHub`}
            className="opacity-40 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-base">open_in_new</span>
          </a>
        )}
      </div>

      <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {project.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-3)' }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function ProjectGallery() {
  return (
    <section className="relative z-10 px-6 py-12 sm:px-10 md:px-16 lg:px-24">
      <motion.h2
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="font-mono text-xs tracking-widest uppercase mb-6"
        style={{ color: 'var(--accent)' }}
      >
        Projects
      </motion.h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </section>
  )
}
