import { NavLink } from 'react-router-dom'

/* Sub-navigation shared by /hardware and /hardware/reference.
   These are real routes rather than tab state on one route, deliberately: each
   keeps its own <title>, description, canonical and prerendered shell, so a
   link to the voltage reference still previews as the voltage reference on
   LinkedIn instead of as "Hardware Lab". A ?tab= switch would have collapsed
   both into one set of meta.
   Rendered by each page inside its own container, so the bar lines up with the
   surrounding content -- /hardware is full-bleed, /hardware/reference is capped
   at an article measure. It sits below the page header on both, so the route
   introduces itself before offering the choice between its two sections. */
const TABS = [
  { to: '/hardware',           end: true,  label: 'Hardware Lab' },
  { to: '/hardware/reference', end: false, label: 'Voltage Reference' },
]

export default function HardwareTabs() {
  return (
    <nav aria-label="Hardware sections" className="flex flex-wrap gap-2 mb-8">
      {TABS.map(({ to, end, label }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="font-mono-data text-sm px-4 py-2 rounded-lg whitespace-nowrap transition-colors duration-150"
          style={({ isActive }) => ({
            color:      isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            background: isActive ? 'var(--bg-surface-2)' : 'transparent',
            border:     `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border)'}`,
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
