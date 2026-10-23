/* The section code / title / intro block that opens a route.

   NO ENTER ANIMATION. This block is the top of every route, so its <h1> or its
   intro paragraph is the Largest Contentful Paint element on most of them.
   Chrome refuses an element as an LCP candidate while its first paint is at
   opacity 0, and prerendered HTML carrying opacity:0 would show a blank page
   until the bundle arrived. Elements further down may animate; this may not.

   Swiss hierarchy: a small legend (the section code), then the title set in a
   bold grotesk, then a rule, then the intro in body type. The size is carried
   by the type, not by decoration.

   Two scales, because the pages genuinely differ:
     display -- gallery and lab routes running the full grid width
     article -- /about and /hardware/reference, capped at a 72rem measure
   The intro width comes from `introClassName` alone. */
const SIZES = {
  display: 'clamp(2.5rem, 1.8rem + 3.4vw, 5.5rem)',
  article: 'clamp(2.1rem, 1.6rem + 2.6vw, 4rem)',
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
        <p className="legend legend-rule mb-5" style={{ color: 'var(--text-muted)' }}>
          {eyebrow}
        </p>
      )}

      <h1
        className="font-display mb-6"
        style={{
          fontSize: SIZES[size] ?? SIZES.display,
          fontWeight: 700,
          lineHeight: 1.02,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h1>

      {intro && (
        <p
          className={`mb-8 ${introClassName}`}
          style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.65 }}
        >
          {intro}
        </p>
      )}

      {children}
    </>
  )
}
