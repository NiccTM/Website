/* The eyebrow / display title / intro block that opens a route.

   NO ENTER ANIMATION, and that is the point of this component's rewrite.

   This block is the top of every route, so its <h1> or its intro paragraph is
   the Largest Contentful Paint element on most of them. It used to be three
   framer-motion elements with initial={{ opacity: 0 }}, which meant the very
   first thing painted on every page was invisible until JavaScript had
   downloaded, parsed, hydrated and started animating.

   That is bad twice over. Chrome refuses an element as an LCP candidate while
   its first paint is at opacity 0, so the metric could not even start until
   hydration; and it makes build-time prerendering pointless, because the
   prerendered HTML would carry style="opacity:0" and show a blank page until
   the bundle arrived.

   The same reasoning is why the hero's first slide has no animation either --
   see the note in styles/index.css. Elements further down the page can still
   use .anim-rise; the first screenful cannot.
   Extracted from HobbiesPage, which had the only full version of it -- the
   other routes each had a partial copy or, in the case of /projects, no page
   heading at all (and therefore no h1, which is an accessibility and search
   problem, not a cosmetic one).

   Two scales, because the pages genuinely differ:
     display -- gallery and lab routes running the full grid width
     article -- /about and /hardware/reference, capped at a 72rem measure,
                where the display size overwhelms a column that narrow
   The intro width comes from `introClassName` alone. It used to also need
   `[&_p]:max-w-none` to escape a global `p { max-width: 72ch }`; that rule is
   now opt-in via `.prose-measure`, so the class here is the only thing setting
   the measure. */
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
        <p
          className="font-mono-data tracking-[0.18em] uppercase mb-4"
          style={{ color: 'var(--accent)', fontSize: '0.875rem' }}
        >
          {eyebrow}
        </p>
      )}

      <h1
        className="font-display mb-6"
        style={{
          fontSize: SIZES[size] ?? SIZES.display,
          fontWeight: 900,
          lineHeight: size === 'article' ? 1.02 : 0.95,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h1>

      {intro && (
        <p
          className={`font-sans mb-8 ${introClassName}`}
          style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.75 }}
        >
          {intro}
        </p>
      )}

      {children}
    </>
  )
}
