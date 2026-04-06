import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { profile } from '../../data/config'

const TAGLINES = [
  'Electrical Engineering Student & Vinyl Collector',
  'PCB Designer · Motor Builder · ML Engineer',
  'UBCO Rover Team · CIRC Competitor',
  'Turning theory into hardware',
  'Building things that actually work',
]

function useRotatingTagline() {
  const [idx,     setIdx]     = useState(0)
  const [text,    setText]    = useState('')
  const [erasing, setErasing] = useState(false)
  const line = TAGLINES[idx]

  useEffect(() => {
    if (!erasing) {
      if (text.length < line.length) {
        const id = setTimeout(() => setText(line.slice(0, text.length + 1)), 38)
        return () => clearTimeout(id)
      }
      const id = setTimeout(() => setErasing(true), 2600)
      return () => clearTimeout(id)
    }
    if (text.length > 0) {
      const id = setTimeout(() => setText((t) => t.slice(0, -1)), 16)
      return () => clearTimeout(id)
    }
    setIdx((i) => (i + 1) % TAGLINES.length)
    setErasing(false)
  }, [text, erasing, line])

  return text
}

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
  const tagline = useRotatingTagline()
  return (
    <motion.header
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 flex flex-col gap-4 px-5 pt-20 pb-10 sm:px-8 md:px-14 lg:px-20 xl:px-28 max-w-5xl"
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

      {/* Tagline — rotating typewriter */}
      <motion.p
        variants={item}
        className="font-mono-data text-base max-w-xl sm:text-lg"
        style={{ color: 'var(--text-secondary)', minHeight: '1.75rem' }}
      >
        {tagline}
        <span
          className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-pulse"
          style={{ background: '#58b8e0', borderRadius: '1px' }}
        />
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
