/**
 * Liminal Aero / Dreamcore ambient background.
 * Three pastel blobs (sky blue, mint, hazy pink) drift via pure CSS animation.
 * A subtle SVG fractal-noise overlay adds a vintage CRT/film-grain texture.
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
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Aurora ribbon, behind the blobs. Frutiger Aero's signature sweep. */}
      <div className="aurora" />

      {/* Pastel gradient blobs */}
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
      <div className="mesh-blob mesh-blob-4" />

      {/* Film-grain / CRT noise. Was 0.03 over a 200px tile, which is close
          enough to nothing that the texture may as well not have shipped.
          0.055 over a 160px tile is still subtle at a glance but survives
          being looked at, and grain is the cheapest honest signal that a
          human chose the surface -- machine-clean flatness is the thing that
          reads as generated. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.055,
          mixBlendMode: 'overlay',
          backgroundImage: NOISE_URL,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
