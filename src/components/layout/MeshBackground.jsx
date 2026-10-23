/**
 * Chassis surface.
 *
 * This was an animated aurora plus four drifting colour blobs -- the Frutiger
 * Aero ambient layer. An instrument chassis is a flat moulded surface, so all
 * of that is gone. What remains is the faintest material grain: at 0.035 over
 * a 160px tile it reads as ABS plastic rather than as a CSS fill, and if a
 * visitor ever notices it as "the grain effect" it is too strong.
 *
 * The file keeps its name so AppShell's import does not churn.
 */
const NOISE_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)'/%3E%3C/svg%3E")`

export default function MeshBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.035,
        mixBlendMode: 'multiply',
        backgroundImage: NOISE_URL,
        backgroundRepeat: 'repeat',
        backgroundSize: '160px 160px',
      }}
    />
  )
}
