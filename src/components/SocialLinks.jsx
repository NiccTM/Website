import { motion } from 'framer-motion'
import { socialLinks } from '../data/config'

export default function SocialLinks() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="relative z-10 flex items-center gap-4 px-6 pb-16 sm:px-10 md:px-16 lg:px-24"
      aria-label="Social links"
    >
      {socialLinks.map((link) => (
        <motion.a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          whileHover={{ scale: 1.1, color: 'var(--accent)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5 font-mono text-xs transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="material-symbols-rounded text-lg">{link.icon}</span>
          <span>{link.label}</span>
        </motion.a>
      ))}
    </motion.nav>
  )
}
