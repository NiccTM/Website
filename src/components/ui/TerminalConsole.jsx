import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { profile, hardware, audioChain } from '../../data/config'
import { useUI } from '../../context/UIContext'

// ─── Auto-play sessions ───────────────────────────────────────────────────────

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

const CHAR_DELAY  = 28
const LINE_PAUSE  = 320
const SESSION_GAP = 900

// ─── useHistory: up/down arrow + 50-item ring buffer ─────────────────────────

function useHistory() {
  const ring    = useRef([])   // newest at index 0
  const cursor  = useRef(-1)   // -1 = live input, 0+ = navigating history

  const push = useCallback((cmd) => {
    if (!cmd || ring.current[0] === cmd) return // skip blanks and duplicates
    ring.current = [cmd, ...ring.current].slice(0, 50)
    cursor.current = -1
  }, [])

  /** direction: 'up' | 'down'. Returns the entry to show, or '' for live input. */
  const navigate = useCallback((direction) => {
    const hist = ring.current
    if (!hist.length) return null
    if (direction === 'up') {
      cursor.current = Math.min(cursor.current + 1, hist.length - 1)
    } else {
      cursor.current = Math.max(cursor.current - 1, -1)
    }
    return cursor.current === -1 ? '' : hist[cursor.current]
  }, [])

  const reset = useCallback(() => { cursor.current = -1 }, [])

  return { push, navigate, reset }
}

// ─── Tab autocomplete ─────────────────────────────────────────────────────────

const COMMAND_KEYS = [
  'help',
  'inspect delorean',
  'inspect bldc',
  'cd audio',
  'cd vinyl',
  'cd ecosort',
  'cd xr',
  'set speed 33',
  'set speed 45',
  'set speed 78',
  'specs --verbose',
  'clear',
]

/** Returns single completion or array of candidates, or null if no match. */
function autocomplete(partial) {
  if (!partial) return null
  const lower = partial.toLowerCase()
  const matches = COMMAND_KEYS.filter((k) => k.startsWith(lower))
  if (matches.length === 1) return matches[0]         // unambiguous → complete
  if (matches.length > 1)  return matches             // ambiguous → show list
  return null
}

// ─── Command parser ───────────────────────────────────────────────────────────

const VALID_RPMS = { '33': 33.333, '45': 45, '78': 78 }

// specs --verbose: full hardware dump
function verboseSpecsOutput() {
  const lines = [
    '══ System Diagnostic ════════════════════',
    `  Host     : ${profile.name}`,
    `  Location : ${profile.location}`,
    `  Program  : ${profile.academics.program} @ ${profile.academics.institution}`,
    '── PC Hardware ──────────────────────────',
    ...hardware.pc.specs.map((s) => `  ${s.key.padEnd(10)}: ${s.value}`),
    '── VR Peripherals ───────────────────────',
    ...hardware.vr.headsets.map((h) => `  • ${h}`),
    '── Audio Rooms ──────────────────────────',
    ...audioChain.rooms.flatMap((room) => [
      `  [${room.label}]`,
      ...room.nodes.map((n) => `    ${n.label.padEnd(26)} ${n.type}`),
    ]),
    '══════════════════════════════════════════',
  ]
  return lines
}

function parseCommand(raw, dispatch) {
  const trimmed = raw.trim()
  const lower   = trimmed.toLowerCase()

  if (!trimmed) return null
  if (lower === 'clear') return { output: null, clear: true }
  if (lower === 'help') {
    return {
      output: [
        'Commands:',
        '  inspect delorean   scroll + exploded view',
        '  inspect bldc       scroll to BLDC motor',
        '  cd audio           scroll to audio chain',
        '  cd vinyl           scroll to vinyl archive',
        '  cd ecosort         scroll to ML demo',
        '  cd xr              scroll to WebXR',
        '  set speed <rpm>    set disc RPM (33 | 45 | 78)',
        '  specs --verbose    full system diagnostic',
        '  clear              clear history',
        '  ↑ / ↓             navigate history',
        '  Tab                autocomplete',
      ],
    }
  }
  if (lower === 'specs --verbose') {
    dispatch({ type: 'HIGHLIGHT_SPECS', payload: true })
    setTimeout(() => dispatch({ type: 'HIGHLIGHT_SPECS', payload: false }), 2500)
    return { output: verboseSpecsOutput() }
  }
  if (lower === 'inspect delorean') {
    dispatch({ type: 'SCROLL_TO', payload: 'delorean' })
    setTimeout(() => dispatch({ type: 'EXPLODE', payload: true }), 600)
    return { output: ['→ Navigating to DeLorean section…', '→ Triggering exploded view'] }
  }
  if (lower === 'inspect bldc') {
    dispatch({ type: 'SCROLL_TO', payload: 'bldc' })
    return { output: ['→ Navigating to BLDC motor…'] }
  }
  if (lower === 'cd audio') {
    dispatch({ type: 'SCROLL_TO', payload: 'audio' })
    return { output: ['→ Navigating to Audio Signal Chain…'] }
  }
  if (lower === 'cd vinyl') {
    dispatch({ type: 'SCROLL_TO', payload: 'vinyl' })
    return { output: ['→ Navigating to Vinyl Archive…'] }
  }
  if (lower === 'cd ecosort') {
    dispatch({ type: 'SCROLL_TO', payload: 'ecosort' })
    return { output: ['→ Navigating to EcoSort ML Demo…'] }
  }
  if (lower === 'cd xr') {
    dispatch({ type: 'SCROLL_TO', payload: 'xr' })
    return { output: ['→ Navigating to WebXR…'] }
  }

  // set speed <rpm>
  const speedMatch = lower.match(/^set speed\s+(\d+)$/)
  if (speedMatch) {
    const key = speedMatch[1]
    const rpmVal = VALID_RPMS[key]
    if (rpmVal) {
      dispatch({ type: 'SET_RPM', payload: rpmVal })
      return {
        output: [
          `→ Disc speed set to ${key === '33' ? '33⅓' : key} RPM`,
          `  Δω = ${((rpmVal / 60) * Math.PI * 2).toFixed(3)} rad/s`,
        ],
      }
    }
    return { output: [`set speed: invalid value "${speedMatch[1]}" — use 33, 45, or 78`] }
  }

  return {
    output: [`zsh: command not found: ${trimmed}`, 'Type "help" for commands.'],
  }
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

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
            <div className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>{session.wrap[0]}</div>
          )}
          {session.output.map((line, i) => (
            <div key={i} className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>{line}</div>
          ))}
          {session.wrap && (
            <div className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>{session.wrap[1]}</div>
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
      {output && output.map((line, i) => (
        <div key={i} className="mt-0.5 pl-5 font-mono-data" style={{ color: 'var(--text-secondary)' }}>
          {line}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TerminalConsole() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [interactive, setInteractive] = useState(false)
  const [inputValue,  setInputValue]  = useState('')
  const [history,     setHistory]     = useState([])
  const [hint,        setHint]        = useState('')   // autocomplete hint overlay

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const { dispatch, rpm } = useUI()
  const { push: pushHist, navigate, reset: resetCursor } = useHistory()

  // Advance auto-sessions
  useEffect(() => {
    if (activeIndex >= SESSIONS.length - 1) {
      const id = setTimeout(() => setInteractive(true), SESSION_GAP)
      return () => clearTimeout(id)
    }
    const session    = SESSIONS[activeIndex]
    const totalDelay = session.prompt.length * CHAR_DELAY + LINE_PAUSE + SESSION_GAP
    const id = setTimeout(() => setActiveIndex((n) => n + 1), totalDelay)
    return () => clearTimeout(id)
  }, [activeIndex])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex, history, interactive])

  // Focus on interactive mode
  useEffect(() => {
    if (interactive) inputRef.current?.focus()
  }, [interactive])

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const entry = navigate('up')
      if (entry !== null) { setInputValue(entry); setHint('') }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const entry = navigate('down')
      if (entry !== null) { setInputValue(entry); setHint('') }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const result = autocomplete(inputValue)
      if (typeof result === 'string') {
        setInputValue(result)
        setHint('')
      } else if (Array.isArray(result)) {
        // Show candidates as a history entry
        setHistory((h) => [...h, { cmd: inputValue, output: result }])
        setHint('')
      }
    } else {
      // Any other key resets history cursor
      resetCursor()
    }
  }

  function handleChange(e) {
    const val = e.target.value
    setInputValue(val)
    // Show hint for unambiguous single completion
    const result = autocomplete(val)
    setHint(typeof result === 'string' ? result.slice(val.length) : '')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const raw = inputValue.trim()
    if (!raw) return

    const result = parseCommand(raw, dispatch)
    pushHist(raw)
    setInputValue('')
    setHint('')

    if (!result) return
    if (result.clear) { setHistory([]); return }
    setHistory((h) => [...h, { cmd: raw, output: result.output }])
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
          <span className="ml-auto font-mono-data flex items-center gap-2" style={{ fontSize: '0.6rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {rpm === 33.333 ? '33⅓' : rpm} RPM
            </span>
            <span style={{ color: 'var(--accent)' }}>INTERACTIVE</span>
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

        {/* Interactive prompt with ghost autocomplete */}
        {interactive && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <span style={{ color: 'var(--accent)' }} className="font-mono-data select-none">›</span>
            <div className="relative flex-1">
              {/* Ghost text (autocomplete hint) */}
              {hint && (
                <span
                  className="absolute inset-0 font-mono-data pointer-events-none select-none"
                  style={{ color: 'var(--text-muted)', opacity: 0.45, fontSize: '0.75rem', lineHeight: 'inherit' }}
                  aria-hidden="true"
                >
                  {inputValue}{hint}
                </span>
              )}
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent font-mono-data outline-none caret-emerald-400 relative"
                style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}
                placeholder={hint ? '' : 'type "help" for commands'}
                autoComplete="off"
                spellCheck={false}
                aria-label="Terminal input"
              />
            </div>
          </form>
        )}

        <div ref={bottomRef} />
      </div>
    </motion.section>
  )
}
