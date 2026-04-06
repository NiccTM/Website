import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <section
      className="flex flex-col items-start justify-center min-h-[80vh] px-5 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40"
      style={{ background: 'transparent' }}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="font-mono-data tracking-[0.18em] uppercase mb-4"
        style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
      >
        Error 404
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display"
        style={{
          fontSize: 'clamp(6rem, 4rem + 12vw, 18rem)',
          fontWeight: 900,
          lineHeight: 0.88,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
        }}
      >
        404.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="font-sans mt-6 mb-10"
        style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}
      >
        The requested system path does not exist.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono-data text-sm px-5 py-2.5 rounded-lg transition-colors duration-150"
          style={{
            border: '1px solid #007AFF',
            color: '#007AFF',
            background: 'transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,122,255,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span className="material-symbols-rounded text-base">arrow_back</span>
          Return to root directory
        </Link>
      </motion.div>
    </section>
  )
}
