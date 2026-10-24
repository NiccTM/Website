/* A numbered section of a technical document: the section number as a small
   legend, a bold grotesk title, then the prose. Shared by the long-form routes
   (reference, CD repair, about, colophon) so their headings stay identical.

   split  -- the title sits in a narrow left column and the prose runs in the
             wide right column at a 68ch measure; on a phone the two stack.
             Used where the article has the full content width to itself.
   stacked (default) -- title above prose, for routes whose prose already
             lives in a column beside a side panel.

   Static, not a scroll reveal: content that starts at opacity 0 is invisible
   to the prerendered page and to anything that reads the HTML without
   running it. `id` must be unique on the page; it labels the section. */
export default function DocSection({ id, n, title, split = false, className = '', children }) {
  const label = (
    <>
      <p aria-hidden="true" className="legend font-readout mb-2" style={{ color: 'var(--text-muted)' }}>{n}</p>
      <h2 id={id} className={`font-display text-xl font-bold leading-snug${split ? '' : ' mb-3'}`} style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
    </>
  )

  if (split) {
    return (
      <section aria-labelledby={id} className={`grid gap-x-10 gap-y-3 md:grid-cols-[13rem_minmax(0,1fr)] py-8 ${className}`} style={{ borderTop: '1px solid var(--seam)' }}>
        <div>{label}</div>
        <div className="max-w-[68ch] min-w-0">{children}</div>
      </section>
    )
  }

  return (
    <section aria-labelledby={id} className={`pt-5 ${className}`} style={{ borderTop: '1px solid var(--seam)' }}>
      {label}
      {children}
    </section>
  )
}
