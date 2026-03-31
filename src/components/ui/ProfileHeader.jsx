import { motion } from 'framer-motion'
import { profile } from '../../data/config'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function ProfileHeader() {
  return (
    <motion.header
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 flex flex-col gap-4 px-6 pt-24 pb-10 sm:px-10 md:px-16 lg:px-24 max-w-5xl"
    >
      {/* Location + affiliation */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <span className="font-mono-data tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          {profile.location}
        </span>
        <span className="font-mono-data" style={{ color: 'var(--text-muted)' }}>·</span>
        <span className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
          {profile.academics.institution} — {profile.academics.program}
        </span>
      </motion.div>

      {/* Name */}
      <motion.h1
        variants={item}
        className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {profile.name}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        variants={item}
        className="font-sans text-base font-light max-w-xl sm:text-lg"
        style={{ color: 'var(--text-secondary)' }}
      >
        {profile.tagline}
      </motion.p>

      {/* Teams */}
      <motion.div variants={item} className="flex flex-wrap gap-2">
        {profile.academics.teams.map((team) => (
          <span
            key={team}
            className="font-mono-data px-3 py-1 rounded-full border-accent"
            style={{ color: 'var(--accent)', background: 'rgba(6,95,70,0.15)' }}
          >
            {team}
          </span>
        ))}
      </motion.div>

      {/* Interests */}
      <motion.div variants={item} className="flex flex-wrap gap-2">
        {profile.interests.map((interest) => (
          <span
            key={interest}
            className="font-mono-data px-3 py-1 rounded border-subtle"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
          >
            {interest}
          </span>
        ))}
      </motion.div>
    </motion.header>
  )
}
