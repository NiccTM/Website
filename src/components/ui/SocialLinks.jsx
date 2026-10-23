import { socialLinks } from '../../data/config'

/* No framer-motion here: this renders inside the home page hero, so any
   animation library imported here lands on the critical path of "/".
   Plain text links in the legend face, with the icon as a small glyph --
   external profiles are ordinary links, not instrument controls. */
export default function SocialLinks() {
  return (
    <nav className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Social links">
      {socialLinks.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          /* py-1 keeps each target >= 24px tall (WCAG 2.2 AA 2.5.8). */
          className="social-link flex items-center gap-1.5 py-1 font-mono-data text-sm"
        >
          <span aria-hidden="true" className="material-symbols-rounded text-base">{link.icon}</span>
          <span>{link.label}</span>
        </a>
      ))}
    </nav>
  )
}
