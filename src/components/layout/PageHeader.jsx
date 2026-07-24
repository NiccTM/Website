import { motion } from 'framer-motion'

/* The eyebrow / display title / intro block that opens a route.
   Extracted from HobbiesPage, which had the only full version of it -- the
   other routes each had a partial copy or, in the case of /projects, no page
   heading at all (and therefore no h1, which is an accessibility and search
   problem, not a cosmetic one).

   Two scales, because the pages genuinely differ:
     display -- gallery and lab routes running the full grid width
     article -- /about and /hardware/reference, capped at a 72rem measure,
                where the display size overwhelms a column that narrow
   `[&_p]:max-w-none` is deliberate: a global `p { max-width: 72ch }` in
   index.css otherwise truncates the intro well short of its container. */
const SIZES = {
  display: 'clamp(2.75rem, 2rem + 4vw, 7rem)',
  article: 'clamp(2.25rem, 1.7rem + 3vw, 4.5rem)',
}

export default function PageHeader({
  eyebrow,
  title,
  intro,
  size = 'display',
  introClassName = 'max-w-2xl',
  children,
}) {
  return (
    <>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="font-mono-data tracking-[0.18em] uppercase mb-4"
          style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
        >
          {eyebrow}
        </motion.p>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display mb-6"
        style={{
          fontSize: SIZES[size] ?? SIZES.display,
          fontWeight: 900,
          lineHeight: size === 'article' ? 1.02 : 0.95,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </motion.h1>

      {intro && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className={`font-sans mb-8 [&_p]:max-w-none ${introClassName}`}
          style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.75 }}
        >
          {intro}
        </motion.p>
      )}

      {children}
    </>
  )
}
