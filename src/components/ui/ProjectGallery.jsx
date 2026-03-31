import { motion } from 'framer-motion'
import { projects } from '../../data/config'

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.07 },
  }),
}

const demoIconMap = {
  architecture: 'account_tree',
  ml: 'psychology',
  '3d': 'view_in_ar',
}

function ProjectCard({ project, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="group relative flex flex-col gap-3 p-5 rounded-xl border-subtle cursor-default"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {project.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
          {project.demo && (
            <span
              className="material-symbols-rounded text-base"
              style={{ color: 'var(--accent)' }}
              title={`Demo: ${project.demo}`}
            >
              {demoIconMap[project.demo]}
            </span>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} on GitHub`}
              style={{ color: 'var(--accent)' }}
            >
              <span className="material-symbols-rounded text-base">open_in_new</span>
            </a>
          )}
        </div>
      </div>

      <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {project.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-mono-data px-2 py-0.5 rounded"
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
    <section className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24">
      <motion.h2
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="font-mono-data tracking-widest uppercase mb-5"
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
