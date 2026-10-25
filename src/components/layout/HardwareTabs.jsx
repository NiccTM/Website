import { NavLink } from 'react-router-dom'

/* Sub-navigation shared by /hardware and /hardware/reference.
   These are real routes rather than tab state on one route, deliberately: each
   keeps its own <title>, description, canonical and prerendered shell, so a
   link to the voltage reference still previews as the voltage reference on
   LinkedIn instead of as "Hardware Lab".
   Drawn as a two-key selector; NavLink's aria-current="page" is what latches
   the key, so the pressed look and the announced state are the same fact. */
const TABS = [
  { to: '/hardware',           end: true,  label: 'Hardware Lab' },
  { to: '/hardware/reference', end: false, label: 'Voltage Reference' },
]

export default function HardwareTabs({ className = 'mb-10' }) {
  return (
    <nav aria-label="Hardware sections" className={`flex flex-wrap items-center gap-2 ${className}`}>
      {TABS.map(({ to, end, label }) => (
        <NavLink key={to} to={to} end={end} className="key key-sm whitespace-nowrap">
          {({ isActive }) => (
            <>
              <span aria-hidden="true" className={`lamp ${isActive ? 'lamp-ok' : ''}`} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
