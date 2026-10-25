import { Link } from 'react-router-dom'
import { FEATURED } from '../../data/featured'
import { thumbSrc } from '../../utils/thumbs'
import Picture from './Picture'
import Evidence from './Evidence'

const pad2 = (n) => String(n).padStart(2, '0')

/* Selected engineering work: an equipment index, not a row of cards.
   Each entry is a ruled record -- catalogue number, optional photograph, then
   the spec rows (role, decision, result) -- separated by the same seam rule the
   panels use. The records are deliberately unequal: an entry with no
   photograph is a text record and gets no placeholder box, so the list does
   not pretend every piece of work has the same evidence behind it.

   Plain <ol>, no scroll reveal, no hover lift: it is a document, and the
   prerender must match the first client render exactly. */
export default function FeaturedWork() {
  return (
    <section
      aria-labelledby="featured-heading"
      className="relative z-10 px-5 pt-14 pb-4 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40 max-w-[1600px] tv:max-w-[2400px] mx-auto w-full"
    >
      <h2 id="featured-heading" className="legend legend-rule mb-2" style={{ color: 'var(--text-muted)' }}>
        Selected engineering work
      </h2>

      <ol>
        {FEATURED.map((f, i) => (
          <li
            key={f.id}
            className="grid gap-x-8 gap-y-4 py-6 lg:grid-cols-[3rem_minmax(0,5fr)_minmax(0,7fr)]"
            style={{ borderBottom: '1px solid var(--seam)' }}
          >
            <span
              aria-hidden="true"
              className="font-readout text-sm lg:pt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {pad2(i + 1)}
            </span>

            {f.media && (
              <div className="panel-recessed p-1 self-start">
                <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                  <Picture
                    src={thumbSrc(f.media.src)}
                    alt={f.media.alt}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={f.media.position ? { objectPosition: f.media.position } : undefined}
                  />
                </div>
              </div>
            )}

            {/* With no photograph the body takes both remaining columns. */}
            <div className={`min-w-0 flex flex-col gap-3${f.media ? '' : ' lg:col-span-2'}`}>
              <div>
                <h3
                  className="font-display font-bold leading-snug"
                  style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.1rem, 0.95rem + 0.8vw, 1.5rem)' }}
                >
                  {f.title}
                </h3>
                <p className="legend mt-1" style={{ color: 'var(--text-muted)' }}>{f.context}</p>
              </div>

              <dl className="spec-grid">
                <div>
                  <dt>Role</dt>
                  <dd>{f.role}</dd>
                </div>
                <div>
                  <dt>Decision</dt>
                  <dd>{f.decision}</dd>
                </div>
                <div>
                  <dt>Result</dt>
                  <dd>
                    {f.result}
                    {f.evidence && <> <Evidence kind={f.evidence} /></>}
                    {f.resultNote && <> {f.resultNote}</>}
                  </dd>
                </div>
              </dl>

              {f.notice && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.notice}</p>
              )}

              <div>
                <Link to={f.to} className="key key-sm">
                  {f.linkLabel}
                  <span className="sr-only">: {f.title}</span>
                  <span aria-hidden="true" className="material-symbols-rounded text-base">chevron_right</span>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
