import { motion } from 'framer-motion'

/**
 * Responsive aspect-ratio-locked iframe container.
 * Props:
 *   src      — iframe src URL
 *   title    — accessible title string
 *   ratio    — 'wide' (16/9) | 'square' (1/1) — default 'wide'
 */
export default function VideoEmbed({ src, title, ratio = 'wide' }) {
  const paddingMap = {
    wide: 'pb-[56.25%]',
    square: 'pb-[100%]',
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative z-10 px-6 py-12 sm:px-10 md:px-16 lg:px-24"
    >
      <div
        className={`relative w-full ${paddingMap[ratio]} overflow-hidden rounded-xl border-subtle`}
        style={{ background: 'var(--bg-surface-1)' }}
      >
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    </motion.section>
  )
}
