/* The chain the NuPower display probe exercised, FEL to panel, with each level
   marked as the evidence allows: proven (read back on the unit) or not
   observable (no register on this SoC reports it). Data: NUPOWER.chain.

   Inline SVG, not React Flow: five fixed boxes need no pan, zoom or node
   panel, and an SVG costs no script. It borrows the site's diagram look:
   raised modules on a recessed, dotted well, edges in --flow-edge. Green
   carries meaning here, as the contract requires: a solid green edge or lamp
   is a proven level. The pins-to-panel edge is dashed and muted because
   whether a signal crosses it is exactly what cannot be observed.

   Two drawings of the same data: a row from lg up, a column below it, where
   a 1000-unit row would shrink the type under 11 px. The hidden one is
   display:none, so it is neither painted nor read; the SVGs themselves are
   aria-hidden and the list in the figure carries the content for assistive
   tech. */

const OK = 'var(--status-ok)'
const MUTED = 'var(--text-muted)'

function Lamp({ x, y, ok }) {
  return ok
    ? <circle cx={x} cy={y} r={4.5} fill={OK} />
    : <circle cx={x} cy={y} r={4} fill="none" stroke={MUTED} strokeWidth={1.5} />
}

function Dots({ id }) {
  return (
    <defs>
      <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="1" fill="#8F8778" />
      </pattern>
    </defs>
  )
}

/* A module box: name and role, then one status block per check. In the row
   drawing the checks sit under a hairline; in the column drawing they sit in
   a right-hand column, so a phone gets five short boxes instead of five tall
   ones. A level with nothing proven gets a dashed outline. */
function Module({ x, y, w, h, level, side = false }) {
  const allUnseen = level.checks.every((c) => !c.ok)
  const cx = side ? x + 156 : x + 14
  const top = side ? y + 22 : y + 82
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx={3}
        fill="var(--panel-raised)"
        stroke={allUnseen ? MUTED : 'var(--chassis-border)'}
        strokeWidth={allUnseen ? 1.25 : 1}
        strokeDasharray={allUnseen ? '5 4' : undefined}
      />
      <text x={x + 14} y={y + 27} className="font-display" fontWeight="700" fontSize="19" fill="var(--text-primary)">{level.name}</text>
      <text x={x + 14} y={y + 46} className="font-mono-data" fontSize="13.5" fill={MUTED}>{level.sub}</text>
      {side
        ? <line x1={cx - 12} x2={cx - 12} y1={y + 12} y2={y + h - 12} stroke="var(--seam)" />
        : <line x1={x + 14} x2={x + w - 14} y1={y + 58} y2={y + 58} stroke="var(--seam)" />}
      {level.checks.map((c, i) => {
        const cy = top + i * 40
        return (
          <g key={c.text}>
            <Lamp x={cx + 5} y={cy - 4} ok={c.ok} />
            <text x={cx + 17} y={cy} className="legend" fontSize="12" fill={c.ok ? OK : MUTED}>
              {c.ok ? 'Proven' : 'Not observable'}
            </text>
            <text x={cx} y={cy + 18} className="font-mono-data" fontSize="13.5" fill="var(--text-secondary)">{c.text}</text>
          </g>
        )
      })}
    </g>
  )
}

function Edge({ x1, y1, x2, y2, seen }) {
  const stroke = seen ? 'var(--flow-edge)' : MUTED
  const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1)
  // Arrowhead drawn by hand so its colour follows the edge in both themes.
  const head = dx
    ? `${x2},${y2} ${x2 - 7 * dx},${y2 - 5} ${x2 - 7 * dx},${y2 + 5}`
    : `${x2},${y2} ${x2 - 5},${y2 - 7 * dy} ${x2 + 5},${y2 - 7 * dy}`
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 6 * dx} y2={y2 - 6 * dy} stroke={stroke} strokeWidth={2} strokeDasharray={seen ? undefined : '5 4'} />
      <polygon points={head} fill={stroke} />
    </g>
  )
}

function RowDrawing({ chain }) {
  const w = 164, gap = 45, h = 154, pad = 12
  const W = pad * 2 + chain.length * w + (chain.length - 1) * gap
  return (
    <svg viewBox={`0 0 ${W} ${h + pad * 2}`} className="hidden lg:block w-full h-auto" aria-hidden="true" focusable="false">
      <Dots id="chain-dots-row" />
      <rect width="100%" height="100%" fill="url(#chain-dots-row)" />
      {chain.map((level, i) => {
        const x = pad + i * (w + gap)
        return (
          <g key={level.id}>
            <Module x={x} y={pad} w={w} h={h} level={level} />
            {i < chain.length - 1 && (
              <Edge x1={x + w + 4} y1={pad + h / 2} x2={x + w + gap - 4} y2={pad + h / 2} seen={chain[i + 1].checks.some((c) => c.ok)} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function ColumnDrawing({ chain }) {
  const W = 340, pad = 12, gap = 24
  const heights = chain.map((l) => 22 + l.checks.length * 40)
  const H = pad * 2 + heights.reduce((a, b) => a + b, 0) + gap * (chain.length - 1)
  let y = pad
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lg:hidden w-full h-auto" aria-hidden="true" focusable="false">
      <Dots id="chain-dots-col" />
      <rect width="100%" height="100%" fill="url(#chain-dots-col)" />
      {chain.map((level, i) => {
        const top = y
        const h = heights[i]
        y += h + gap
        return (
          <g key={level.id}>
            <Module x={pad} y={top} w={W - pad * 2} h={h} level={level} side />
            {i < chain.length - 1 && (
              <Edge x1={W / 2} y1={top + h + 4} x2={W / 2} y2={top + h + gap - 4} seen={chain[i + 1].checks.some((c) => c.ok)} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function ProbeChain({ chain, id = 'probe-chain' }) {
  return (
    <figure aria-labelledby={`${id}-title`} className="mb-12">
      <div className="panel-recessed p-1 max-w-[26rem] lg:max-w-none">
        <RowDrawing chain={chain} />
        <ColumnDrawing chain={chain} />
      </div>
      <ol className="sr-only">
        {chain.map((level) => (
          <li key={level.id}>
            {level.name} ({level.sub}): {level.checks.map((c) => `${c.ok ? 'proven' : 'not observable'}, ${c.text}`).join('; ')}
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 max-w-[68ch]">
        <p id={`${id}-title`} className="legend" style={{ color: 'var(--text-primary)' }}>Where software stops</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          The path the probe drove, from the USB link to the glass. Proven means read back on the unit; the pins are proven as register settings only. Not observable means no register on this chip reports it.
        </p>
      </figcaption>
    </figure>
  )
}
