import { Link } from 'react-router-dom'

/* A recessed plate beside a route's title, the way a small data plate sits at
   the top of an instrument's front panel. Used by /hobbies as its logbook.

   Each route's header has its own composition, and this is only one of them:
   Projects runs a catalogue strip across the width, Hardware keeps a bench
   index on the row of route keys, About sets an editorial standfirst, Colophon
   prints an imprint line. Do not reach for this plate on a new route by
   default -- a second copy starts the template the headers were rebuilt to get
   away from. Nothing in it may be invented: every value comes from the data
   the page renders.

   rows: [{ label, value, href?, to? }]
     href -- an in-page anchor or external URL (plain <a>)
     to   -- a route (react-router <Link>)
   A row with neither is a static fact.

   Static on purpose, like PageHeader: no entrance animation, so it is in the
   prerendered page and never delays the title or intro beside it. */
export default function HeaderPlate({ legend, label, rows = [] }) {
  return (
    <aside aria-label={label ?? legend} className="header-plate panel-recessed">
      <p className="legend legend-rule mb-1" style={{ color: 'var(--text-muted)' }}>{legend}</p>
      <ul className="header-plate-rows">
        {rows.map((r) => {
          const body = (
            <>
              <span className="legend header-plate-label">{r.label}</span>
              <span className="header-plate-value">{r.value}</span>
            </>
          )
          return (
            <li key={r.label}>
              {r.to ? (
                <Link to={r.to} className="header-plate-row header-plate-link">{body}</Link>
              ) : r.href ? (
                <a href={r.href} className="header-plate-row header-plate-link">{body}</a>
              ) : (
                <span className="header-plate-row">{body}</span>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
