/* An award plate: the award's own text from config, and a lamp. A placing or
   finalist result lights the OK lamp; the practice-course entry is a course
   tag rather than a result, so its lamp stays unlit. The text always carries
   the meaning -- the lamp is aria-hidden. Shared by the catalogue card and the
   project modal so the two cannot drift. */
const AWARD_LAMP = { gold: 'lamp-ok', bronze: 'lamp-ok', cyan: 'lamp-ok', practice: '' }

export default function ProjectAward({ award }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono-data text-xs px-2 py-0.5"
      style={{
        background: 'var(--panel-plate)',
        border: '1px solid var(--seam)',
        borderRadius: '2px',
        color: 'var(--text-primary)',
      }}
    >
      <span aria-hidden="true" className={`lamp ${AWARD_LAMP[award.tier] ?? ''}`} />
      {award.label}
    </span>
  )
}
