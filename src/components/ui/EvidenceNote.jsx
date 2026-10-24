import { useId, useState } from 'react'
import { EVIDENCE_KINDS } from './Evidence'

/* An evidence mark that can be opened to show what it rests on.

   The plain mark (Evidence.jsx) says HOW a figure was obtained. This one also
   says WITH WHAT: the working and inputs behind a calculation, where an
   observation was made, which material data a nominal figure comes from --
   and, as plainly, what was not recorded. The note text comes from the page's
   data file; nothing here composes a claim.

   APG disclosure pattern: a real <button> with aria-expanded and
   aria-controls, toggled by click, Enter or Space. No hover dependency, no
   animation. The panel is always in the markup, `hidden` until opened, so the
   prerendered shell carries the same text the client renders and a crawler
   or a reader with CSS off still gets it.

   Everything is a <span> (block-styled where needed) because a mark can sit
   inside a <p>, and a <div> there is invalid HTML that the parser would hoist
   out -- a hydration mismatch waiting to happen. useId keeps the panel id
   identical on the server and in the browser.

   EvidenceNote keeps the two together. A caller that needs the panel
   somewhere else uses EvidenceButton and EvidencePanel directly (a table row
   puts the panel in a full-width row beneath, so the note is not squeezed
   into a narrow cell). */
export function EvidenceButton({ note, open, onToggle, controls, className = '' }) {
  const k = EVIDENCE_KINDS[note.kind]
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={`evidence evidence-${note.kind} evidence-button ${className}`}
    >
      <span aria-hidden="true">{k.glyph}</span>
      <span aria-hidden="true">{k.short}</span>
      <span className="sr-only">{k.full}: basis for {note.quantity}</span>
      <span aria-hidden="true" className="evidence-button-state">{open ? '−' : '+'}</span>
    </button>
  )
}

export function EvidencePanel({ id, note, open }) {
  const k = EVIDENCE_KINDS[note.kind]
  return (
    <span id={id} hidden={!open} className="evidence-panel">
      <span className="evidence-panel-head">
        <span className={`evidence-panel-kind evidence-${note.kind}`}>{k.full}</span>
        <span>{note.quantity}</span>
      </span>
      {note.lines.map(([label, text]) => (
        <span key={label} className="evidence-panel-row">
          <span className="evidence-panel-label">{label}</span>
          <span>{text}</span>
        </span>
      ))}
    </span>
  )
}

export default function EvidenceNote({ note, className = '' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <EvidenceButton note={note} open={open} onToggle={() => setOpen((v) => !v)} controls={id} className={className} />
      <EvidencePanel id={id} note={note} open={open} />
    </>
  )
}
