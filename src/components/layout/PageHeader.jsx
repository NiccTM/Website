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
   The intro width comes from `introClassName` alone.

   Route-specific treatments ride on two optional props, so the five routes
   that used to open identically can each compose their own header from the
   same vocabulary (see CASSETTE-DESIGN-CONTRACT.md, "Page-specific
   treatments"):
     plate    -- a HeaderPlate in a right column from lg up (/hobbies).
                 plateFrom="lg" draws it only there: below lg it would stack
                 under the intro and push the page's own content ~250px down
                 for a summary of that same content. Without plateFrom it
                 stacks under the intro on small screens.
     lede     -- the intro set as an editorial standfirst: larger, in the
                 primary ink (/about).
     children -- anything that belongs under the intro (Projects' catalogue
                 strip, Colophon's imprint, About's status line). With a
                 plate, children stay in the left column beside it, so a
                 plate taller than the title does not push them down
                 (Hobbies' tab keys).
   The title and intro stay first in source order, so the LCP element does
   not move behind the new parts. */
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
  plate,
  plateFrom,
  lede = false,
  children,
}) {
  const eyebrowEl = eyebrow && (
    <p className="legend legend-rule mb-5" style={{ color: 'var(--text-muted)' }}>
      {eyebrow}
    </p>
  )
  const titleBlock = (
    <>
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
          style={lede
            ? { color: 'var(--text-primary)', fontSize: 'clamp(1.1875rem, 1.05rem + 0.5vw, 1.4375rem)', lineHeight: 1.5 }
            : { color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.65 }}
        >
          {intro}
        </p>
      )}
    </>
  )

  if (!plate) {
    return (
      <>
        {eyebrowEl}
        {titleBlock}
        {children}
      </>
    )
  }

  return (
    <>
      {eyebrowEl}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem] lg:gap-x-12 lg:items-start">
        <div className="min-w-0">{titleBlock}{children}</div>
        <div className={`mb-8 max-w-md lg:max-w-none lg:mb-0 lg:pt-2 lg:row-start-1 lg:col-start-2 ${plateFrom === 'lg' ? 'hidden lg:block' : ''}`}>{plate}</div>
      </div>
    </>
  )
}
