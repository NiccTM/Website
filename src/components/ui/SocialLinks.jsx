import { socialLinks } from '../../data/config'

/* No framer-motion here. This renders inside the home page hero, so importing
   it pulled a 117 KB animation library onto the critical path of "/" to do a
   fade and a hover scale. Both are one CSS line each. See the CSS REPLACEMENTS
   block in styles/index.css. */
export default function SocialLinks() {
  return (
    <nav
      className="anim-fade relative z-10 flex items-center gap-5"
      style={{ '--anim-delay': '0.7s' }}
      aria-label="Social links"
    >
      {socialLinks.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          /* py-1 lifts these from 23px to >=24px tall. WCAG 2.2 AA 2.5.8 sets a
             24x24 CSS px floor for pointer targets; these sat one pixel under,
             and the inline-text exception does not cover a standalone link row. */
          className="flex items-center gap-1.5 py-1 font-mono-data transition-all duration-200
                     hover:scale-[1.08] active:scale-95"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-lg">{link.icon}</span>
          <span>{link.label}</span>
        </a>
      ))}
    </nav>
  )
}
