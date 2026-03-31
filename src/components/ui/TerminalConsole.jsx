import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { profile, hardware } from '../../data/config'

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

const CHAR_DELAY = 28   // ms per character
const LINE_PAUSE = 320  // ms before output appears
const SESSION_GAP = 900 // ms between sessions

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
      {/* Prompt line */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--accent)' }} className="font-mono-data select-none">›</span>
        <span className="font-mono-data" style={{ color: 'var(--text-primary)' }}>{typed}</span>
        {visible && !showOutput && (
          <span
            className="inline-block w-[7px] h-[14px] ml-0.5 animate-pulse"
            style={{ background: 'var(--accent)' }}
          />
        )}
      </div>

      {/* Output */}
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
            <div key={i} className="font-mono-data" style={{ color: 'var(--text-secondary)' }}>
              {line}
            </div>
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

export default function TerminalConsole() {
  const [activeIndex, setActiveIndex] = useState(0)
  const bottomRef = useRef(null)

  // Advance sessions
  useEffect(() => {
    if (activeIndex >= SESSIONS.length - 1) return
    const session = SESSIONS[activeIndex]
    const totalDelay =
      session.prompt.length * CHAR_DELAY + LINE_PAUSE + SESSION_GAP
    const id = setTimeout(() => setActiveIndex((i) => i + 1), totalDelay)
    return () => clearTimeout(id)
  }, [activeIndex])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex])

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.45 }}
      className="relative z-10 mx-6 mb-10 sm:mx-10 md:mx-16 lg:mx-24 max-w-2xl rounded-xl border-subtle overflow-hidden"
      style={{ background: 'var(--bg-surface-1)' }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span
          className="ml-3 font-mono-data"
          style={{ color: 'var(--text-muted)' }}
        >
          nic@ubco ~ zsh
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-5 max-h-64 overflow-y-auto">
        {SESSIONS.slice(0, activeIndex + 1).map((session, i) => (
          <TerminalLine key={i} session={session} visible={i <= activeIndex} />
        ))}
        <div ref={bottomRef} />
      </div>
    </motion.section>
  )
}
