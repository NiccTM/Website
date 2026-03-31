import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { profile, hardware } from '../../data/config'
import { useUI } from '../../context/UIContext'

const SESSIONS = [
  {
    prompt: 'whoami',
    output: [`${profile.name}  ·  ${profile.academics.program} @ ${profile.academics.institution}`],
  },
  {
    prompt: 'cat specs.json | jq .pc',
    output: hardware.pc.specs.map((s) => `  "${s.key}": "${s.value}"`),
    wrap: ['{', '}'],
  },
  {
    prompt: 'ls vr/',
    output: hardware.vr.headsets,
  },
  {
    prompt: 'ls projects/',
    output: ['feeble-presence/', 'ecosort/', 'bldc-motor/'],
  },
  {
    prompt: 'echo $INTERESTS',
    output: [profile.interests.join('  ·  ')],
  },
]

// ─── Command parser ───────────────────────────────────────────────────────────

const COMMANDS = {
  help: () => ({
    output: [
      'Available commands:',
      '  inspect delorean  — scroll to DeLorean section + trigger exploded view',
      '  inspect bldc      — scroll to BLDC motor model',
      '  cd audio          — scroll to Audio Signal Chain',
      '  cd vinyl          — scroll to Vinyl Archive',
      '  cd ecosort        — scroll to EcoSort ML demo',
      '  cd xr             — scroll to WebXR section',
      '  clear             — clear interactive history',
    ],
    action: null,
  }),
  'inspect delorean': () => ({
    output: ['→ Navigating to DeLorean section…', '→ Triggering exploded view'],
    action: { type: 'SCROLL_TO', payload: 'delorean' },
    secondary: { type: 'EXPLODE', payload: true },
  }),
  'inspect bldc': () => ({
    output: ['→ Navigating to BLDC Motor model…'],
    action: { type: 'SCROLL_TO', payload: 'bldc' },
  }),
  'cd audio': () => ({
    output: ['→ Navigating to Audio Signal Chain…'],
    action: { type: 'SCROLL_TO', payload: 'audio' },
  }),
  'cd vinyl': () => ({
    output: ['→ Navigating to Vinyl Archive…'],
    action: { type: 'SCROLL_TO', payload: 'vinyl' },
  }),
  'cd ecosort': () => ({
    output: ['→ Navigating to EcoSort ML Demo…'],
    action: { type: 'SCROLL_TO', payload: 'ecosort' },
  }),
  'cd xr': () => ({
    output: ['→ Navigating to WebXR section…'],
    action: { type: 'SCROLL_TO', payload: 'xr' },
  }),
}

function parseCommand(raw) {
  const trimmed = raw.trim().toLowerCase()
  if (trimmed === 'clear') return { output: null, action: null, clear: true }
  const match = COMMANDS[trimmed]
  if (match) return match()
  return {
    output: [`zsh: command not found: ${raw.trim()}`, 'Type "help" for available commands.'],
    action: null,
  }
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

const CHAR_DELAY  = 28
const LINE_PAUSE  = 320
const SESSION_GAP = 900

function useTypewriter(text, active) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active) { setDisplayed(''); return }
    let i = 0
    setDisplayed('')
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, CHAR_DELAY)
    return () => clearInterval(id)
  }, [text, active])
  return displayed
}

// ─── Read-only auto session line ──────────────────────────────────────────────

function TerminalLine({ session, visible }) {
  const typed = useTypewriter(session.prompt, visible)
  const [showOutput, setShowOutput] = useState(false)

  useEffect(() => {
    if (!visible) { setShowOutput(false); return }
    const id = setTimeout(
      () => setShowOutput(true),
      session.prompt.length * CHAR_DELAY + LINE_PAUSE
    )
    return () => clearTimeout(id)
  }, [visible, session.prompt])

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--accent)' }} className="font-mono-data select-none">›</span>
        <span className="font-mono-data" style={{ color: 'var(--text-primary)' }}>{typed}</span>
        {visible && !showOutput && (
          <span className="inline-block w-[7px] h-[14px] ml-0.5 animate-pulse"
            style={{ background: 'var(--accent)' }} />
        )}
      </div>
      {showOutput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-1 pl-5"
        >
          {session.wrap && (
            <div className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>
              {session.wrap[0]}
            </div>
          )}
          {session.output.map((line, i) => (
            <div key={i} className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>{line}</div>
          ))}
          {session.wrap && (
            <div className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>
              {session.wrap[1]}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ─── Interactive history entry ────────────────────────────────────────────────

function HistoryEntry({ cmd, output }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--accent)' }} className="font-mono-data select-none">›</span>
        <span className="font-mono-data" style={{ color: 'var(--text-primary)' }}>{cmd}</span>
      </div>
      {output && (
        <div className="mt-1 pl-5">
          {output.map((line, i) => (
            <div key={i} className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TerminalConsole() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [interactive, setInteractive] = useState(false)
  const [inputValue, setInputValue]   = useState('')
  const [history, setHistory]         = useState([])
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const { dispatch } = useUI()

  // Advance auto-sessions
  useEffect(() => {
    if (activeIndex >= SESSIONS.length - 1) {
      // All sessions done — activate interactive mode after a brief pause
      const id = setTimeout(() => setInteractive(true), SESSION_GAP)
      return () => clearTimeout(id)
    }
    const session  = SESSIONS[activeIndex]
    const totalDelay = session.prompt.length * CHAR_DELAY + LINE_PAUSE + SESSION_GAP
    const id = setTimeout(() => setActiveIndex((i) => i + 1), totalDelay)
    return () => clearTimeout(id)
  }, [activeIndex])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex, history, interactive])

  // Focus input when interactive mode activates
  useEffect(() => {
    if (interactive) inputRef.current?.focus()
  }, [interactive])

  function handleSubmit(e) {
    e.preventDefault()
    const raw = inputValue.trim()
    if (!raw) return

    const result = parseCommand(raw)

    if (result.clear) {
      setHistory([])
      setInputValue('')
      return
    }

    setHistory((h) => [...h, { cmd: raw, output: result.output }])
    setInputValue('')

    if (result.action) {
      dispatch(result.action)
      // Secondary action (e.g. explode after scroll)
      if (result.secondary) {
        setTimeout(() => dispatch(result.secondary), 600)
      }
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.45 }}
      className="relative z-10 mx-6 mb-10 sm:mx-10 md:mx-16 lg:mx-24 max-w-2xl rounded-xl border-subtle overflow-hidden"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-3 font-mono-data" style={{ color: 'var(--text-muted)' }}>
          nic@ubco ~ zsh
        </span>
        {interactive && (
          <span className="ml-auto font-mono-data" style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>
            INTERACTIVE
          </span>
        )}
      </div>

      {/* Body */}
      <div
        className="p-5 max-h-72 overflow-y-auto"
        onClick={() => interactive && inputRef.current?.focus()}
      >
        {/* Auto-play sessions */}
        {SESSIONS.slice(0, activeIndex + 1).map((session, i) => (
          <TerminalLine key={i} session={session} visible={i <= activeIndex} />
        ))}

        {/* Interactive history */}
        <AnimatePresence initial={false}>
          {history.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <HistoryEntry cmd={entry.cmd} output={entry.output} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Interactive input */}
        {interactive && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="font-mono-data select-none">›</span>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent font-mono-data outline-none caret-emerald-400"
              style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}
              placeholder="type 'help' for commands"
              autoComplete="off"
              spellCheck={false}
              aria-label="Terminal input"
            />
          </form>
        )}

        <div ref={bottomRef} />
      </div>
    </motion.section>
  )
}
