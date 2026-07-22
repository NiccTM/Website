import { motion } from 'framer-motion'
import { socialLinks } from '../../data/config'

export default function SocialLinks() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="relative z-10 flex items-center gap-5"
      aria-label="Social links"
    >
      {socialLinks.map((link) => (
        <motion.a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          /* py-1 lifts these from 23px to >=24px tall. WCAG 2.2 AA 2.5.8 sets a
             24x24 CSS px floor for pointer targets; these sat one pixel under,
             and the inline-text exception does not cover a standalone link row. */
          className="flex items-center gap-1.5 py-1 font-mono-data transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-lg">{link.icon}</span>
          <span>{link.label}</span>
        </motion.a>
      ))}
    </motion.nav>
  )
}
