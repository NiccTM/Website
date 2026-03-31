import { motion } from 'framer-motion'
import { profile } from '../data/config'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function ProfileHeader() {
  return (
    <motion.header
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 flex flex-col gap-3 px-6 pt-24 pb-16 sm:px-10 md:px-16 lg:px-24 max-w-4xl"
    >
      <motion.span
        variants={item}
        className="font-mono text-xs tracking-widest uppercase"
        style={{ color: 'var(--accent)' }}
      >
        {profile.location}
      </motion.span>

      <motion.h1
        variants={item}
        className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {profile.name}
      </motion.h1>

      <motion.p
        variants={item}
        className="font-sans text-base font-light sm:text-lg md:text-xl max-w-xl"
        style={{ color: 'var(--text-secondary)' }}
      >
        {profile.tagline}
      </motion.p>

      <motion.div variants={item} className="flex flex-wrap gap-2 pt-2">
        {profile.interests.map((interest) => (
          <span
            key={interest}
            className="font-mono text-xs px-3 py-1 rounded-full border-subtle"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
          >
            {interest}
          </span>
        ))}
      </motion.div>
    </motion.header>
  )
}
