import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { profile, hardware, audioChain } from '../../data/config'
import { useUI } from '../../context/UIContext'
import { useAppStore } from '../../store/useAppStore'

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
    output: ['unbox/', 'firesense/', 'delorean-apsc171/', 'consultation/', 'whistler/', 'feeble-presence/', 'bldc-motor/'],
  },
  {
    prompt: 'echo $INTERESTS',
    output: [profile.interests.join('  ·  ')],
  },
]

const CHAR_DELAY  = 28
const LINE_PAUSE  = 320
const SESSION_GAP = 900

// ─── Tab autocomplete ─────────────────────────────────────────────────────────

const COMMAND_KEYS = [
  'help',
  'ls',
  'whoami',
  'goto home',
  'goto projects',
  'goto hardware',
  'goto archive',
  'goto systems',
  'cd audio',
  'cd hardware',
  'cd vinyl',
  'cd ecosort',
  'cd systems',
  'inspect ecosort',
  'inspect ecosort --cv',
  'inspect ecosort --hardware',

  'inspect unbox',
  'inspect firesense',
  'inspect delorean',
  'inspect consultation',
  'inspect whistler',
  'inspect pcb',
  'inspect motor',
  'inspect aerospace',
  'inspect bench',
  'motor --theory',
  'gallery next',
  'set speed 33',
  'set speed 45',
  'set speed 78',
  'set bpm ',
  'specs --verbose',
  'ping ubco.ca',
  'git log',
  'fortune',
  'history',
  'clear',
]

function autocomplete(partial) {
  if (!partial) return null
  const lower = partial.toLowerCase()
  const matches = COMMAND_KEYS.filter((k) => k.startsWith(lower))
  if (matches.length === 1) return matches[0]
  if (matches.length > 1)  return matches
  return null
}

// ─── Command parser ───────────────────────────────────────────────────────────

const VALID_RPMS = { '33': 33.333, '45': 45, '78': 78 }

function verboseSpecsOutput() {
  return [
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
}

const FORTUNES = [
  '"Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke',
  '"First, solve the problem. Then, write the code." — John Johnson',
  '"It works on my machine." — Every developer, ever',
  '"The best motor is the one that actually spins." — Nic Piraino, 2024',
  '"Premature optimization is the root of all evil." — Knuth',
  '"Have you tried turning it off and on again?"',
  '"sudo make me a sandwich." — xkcd 149',
  '"I have not failed. I\'ve just found 10,000 ways that won\'t work." — Edison',
]

const FAKE_COMMITS = [
  'a3f1c2d (HEAD -> main)  feat: add mouse-reactive particle system',
  'b8e4901  fix: restore CONF_THRESHOLD to 0.65 after false positive incident',
  'c1836de  content: fix project GitHub links, add LinkedIn + Discogs',
  'e8ec3d8  remove: 3D model viewer sections (no GLB assets yet)',
  '858013b  feat: tonearm state machine, terminal history/autocomplete, RPM sync',
  '7357319  feat: anisotropic vinyl, tonearm pivot animation, terminal commands',
  '9398356  fix: render turntable modal via React portal to escape stacking context',
  '4d2f11a  feat: BLDC motor technical deep dive — challenge/solution cards',
  '2c9e873  chore: upgrade PLA+ stator to PETG HF after thermal analysis',
  '1a0b334  init: APSC 169 UnBox impact detection system',
]

function parseCommand(raw, { dispatch, navigate, setRpm, setBpm, nextGallery, setPcbCommand, setPcbXray, setOverclock, commandRing }) {
  const trimmed = raw.trim()
  const lower   = trimmed.toLowerCase()

  if (!trimmed) return null
  if (lower === 'clear') return { output: null, clear: true }

  if (lower === 'help') {
    return {
      output: [
        'Navigation:',
        '  ls              list portfolio directories',
        '  whoami          display profile summary',
        '  goto home       go to home page',
        '  goto projects   go to projects page',
        '  goto hardware   go to PCB lab',
        '  goto archive    go to vinyl archive',
        '  goto systems    go to EcoSort / systems page',
        '  cd hardware     navigate to PCB lab',
        'Scroll:',
        '  cd audio        scroll to audio chain',
        '  cd vinyl        scroll to vinyl archive',
        '  cd ecosort      navigate to EcoSort demo',
        '  cd systems      navigate to EcoSort demo',
        '  inspect ecosort run self-test + navigate to EcoSort',
        '  inspect unbox          UnBox awards + impact-trigger logic',
        '  inspect firesense      FireSense design summary',
        '  inspect delorean       scroll to DeLorean video',
        '  inspect consultation   ICCP framework + Port of Vancouver engagement',
        '  inspect whistler       Accessibility pillars — Whistler Theatre',
        'Hardware Lab:',
        '  inspect pcb     reset 3D camera + highlight sensor pads',
        '  inspect motor   full BLDC spec sheet + BOM breakdown',
        '  motor --theory  KV rating / inductance / turn-count relationship',
        '  gallery next    cycle to next reference image',
        '  set bpm <n>     PCB pulse BPM (40-180)',
        '  set speed <rpm> vinyl RPM (33 | 45 | 78)',
        '  specs --verbose full system diagnostic',
        'Terminal:',
        '  clear           clear history',
        '  ↑ / ↓          navigate history',
        '  Tab             autocomplete',
      ],
    }
  }

  if (lower === 'ls') {
    return {
      output: [
        'total 5',
        'drwxr-xr-x  projects/',
        'drwxr-xr-x  hardware/',
        'drwxr-xr-x  archive/',
        'drwxr-xr-x  systems/',
        '-rw-r--r--  README.md',
      ],
    }
  }

  if (lower === 'whoami') {
    return {
      output: [
        `${profile.name}`,
        `${profile.academics.program} @ ${profile.academics.institution}`,
        `Teams  : ${profile.academics.teams.join('  ·  ')}`,
        `GitHub : ${profile.github}`,
        `Stack  : React · R3F · Python · C++ · SolidWorks · Altium`,
      ],
    }
  }

  // ── Easter eggs ─────────────────────────────────────────────────────────
  if (lower === 'neofetch') {
    return {
      output: [
        '  ┌────────────────────────────────────────────┐',
        '  │  nic@ubco-eng-server                       │',
        '  │  ─────────────────────────────────────     │',
        '  │  OS       : Arch Linux x86_64              │',
        '  │  Host     : UBCO Engineering Server        │',
        '  │  Uptime   : 3 years, 47 days               │',
        '  │  Shell    : zsh 5.9                        │',
        '  │  Terminal : portfolio-v2.1.0               │',
        '  │  CPU      : Ryzen 7 9800X3D @ 4.7GHz      │',
        '  │  Memory   : 32GB DDR5 6000MHz CL30         │',
        '  │  GPU      : Zotac RTX 3090 24GB            │',
        '  │  Theme    : Engineering Dark               │',
        '  │             [#0b0805 / #58b8e0]            │',
        '  └────────────────────────────────────────────┘',
      ],
    }
  }

  if (lower === 'sudo rm -rf /' || lower === 'sudo rm -rf /*') {
    return {
      output: [
        '[ERROR: PERMISSION DENIED. INCIDENT REPORTED TO UBCO IT.]',
      ],
    }
  }

  if (lower === 'inspect aerospace') {
    navigate('/hardware')
    return {
      output: [
        '[SYSTEM LOG: UAS DRONE WATER CONTACT SENSOR.]',
        '[SYSTEM LOG: RETRIEVING SCHEMATICS AND PCB LAYOUT.]',
        '── Water Contact Sensor · UBCO UAS Aerospace Team ───',
        '  Application : Detect tube-water contact inside target barrel',
        '  Tool        : KiCad 7.0',
        '  Focus       : Schematic capture + PCB layout',
        '  Year        : 2nd Year Engineering',
        '─────────────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'inspect bench') {
    return {
      output: [
        '[FABRICATION LOG: LOAD-BEARING WORKBENCH.]',
        '[FABRICATION LOG: COLLABORATIVE TIMBER CONSTRUCTION.]',
        '  Co-built with EE housemate',
        '  Supports mechanical + electronics testing loads',
      ],
    }
  }

  if (lower === 'diagnose hardware') {
    return {
      output: [
        '[SYSTEM LOG: EXECUTING CONTINUITY TEST.]',
        '[SYSTEM LOG: TRACING COMPONENT FAILURE...]',
        '[SYSTEM LOG: FAULT ISOLATED.]',
        '[SYSTEM LOG: RESTORATION COMPLETE.]',
      ],
    }
  }

  if (lower === 'overclock') {
    setOverclock(true)
    setTimeout(() => setOverclock(false), 3000)
    return {
      output: [
        '[WARNING: THERMAL THROTTLING]',
        '  Core temp  : 94°C → 101°C',
        '  Clock      : 4700MHz → 5100MHz',
        '  Throttle   : Reducing to 3800MHz...',
        '[SYSTEM: Emergency cooling protocol engaged. Restoring in 3s]',
      ],
    }
  }

  // goto <route>
  const gotoMatch = lower.match(/^goto\s+(\w+)$/)
  if (gotoMatch) {
    const dest = gotoMatch[1]
    const routeMap = { home: '/', projects: '/projects', hardware: '/hardware', archive: '/archive', systems: '/systems' }
    const route = routeMap[dest]
    if (route) {
      navigate(route)
      return { output: [`→ Navigating to /${dest === 'home' ? '' : dest}…`] }
    }
    return { output: [`goto: unknown destination "${dest}"  — try home | projects | hardware | archive`] }
  }

  if (lower === 'specs --verbose') {
    dispatch({ type: 'HIGHLIGHT_SPECS', payload: true })
    setTimeout(() => dispatch({ type: 'HIGHLIGHT_SPECS', payload: false }), 2500)
    return { output: verboseSpecsOutput() }
  }
  if (lower === 'inspect unbox') {
    navigate('/projects')
    return {
      output: [
        '── UnBox · APSC 169 ──────────────────────────',
        '  Awards : 🥇 1st Place — Project Impact',
        '           🥉 3rd Place — Project Design',
        '── Hardware Specs ────────────────────────────',
        '  MCU     : Arduino Uno R3  (ATmega328P, 5V, 16MHz)',
        '  Sensor  : ADXL345 3-axis accelerometer',
        '            I²C addr 0x53 (SDO → GND)',
        '            Range: ±16g · Resolution: 13-bit',
        '            Data rate: 400Hz (RATE reg 0x0C)',
        '  Wiring  : SDA→A4  SCL→A5  VCC→3.3V  INT1→D2',
        '── Detection Logic ───────────────────────────',
        '  magnitude  = √(ax² + ay² + az²)',
        '  threshold  = 2.5g  (empirically tuned)',
        '  impact_flag = magnitude > threshold',
        '  Output  : LED D13 + Piezo buzzer on D8',
        '  Logging : Serial JSON @ 9600 baud',
        '──────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'inspect firesense') {
    navigate('/projects')
    return {
      output: [
        '── FireSense · APSC 171 ──────────────────────',
        '  Award   : 🥉  3rd Place — Project Design',
        '  System  : Autonomous Wildfire Detection Architecture',
        '  Sensors : Thermal IR · Gas (MQ-2) · Optical smoke',
        '  Logic   : Multi-sensor fusion with weighted vote',
        '            alert when ≥2 independent triggers fire',
        '  Comms   : LoRa 915MHz backhaul to base station',
        '  Output  : GPS-tagged alert packet + SMS relay',
        '  Ref     : 171 script.pdf (technical video script)',
        '──────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'inspect consultation') {
    navigate('/projects')
    return {
      output: [
        '── Indigenous Community Consultation · APSC 201 ──',
        '  Category : Professional Practice',
        '  Client   : Gull Bay First Nation, Ontario',
        '  Focus    : Indigenous Community Consultation Policy (ICCP)',
        '  Pillars  :',
        '    1. Sustainable Development — long-term resource stewardship',
        '    2. Community Engagement   — structured dialogue with Nations',
        '    3. Environmental Steward. — impact assessment integration',
        '  Output   : Policy framework document + stakeholder report',
        '  Methods  : Stakeholder mapping · Policy analysis · Ethical ENG',
        '─────────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'inspect whistler') {
    navigate('/projects')
    return {
      output: [
        '── Whistler Inclusive Theatre ────────────────────',
        '  Category : Technical Communication / Design',
        '  Location : Whistler, BC',
        '  Focus    : Universal Design for a multi-purpose theatre',
        '  Pillars  :',
        '    1. Inclusivity      — equitable access for all abilities',
        '    2. Safety           — egress compliance, clear sight-lines',
        '    3. Universal Design — UD principles applied to spatial layout',
        '  Output   : Accessibility audit + inclusive spatial design',
        '             Stakeholder-focused technical report',
        '  Standards: AODA · BC Building Code accessibility reqs',
        '─────────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'inspect delorean') {
    navigate('/projects')
    setTimeout(() => {
      const el = document.getElementById('section-delorean')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
    return { output: ['→ Navigating to DeLorean section…'] }
  }
  if (lower === 'cd hardware') {
    navigate('/hardware')
    return { output: ['→ Navigating to PCB Lab…'] }
  }
  if (lower === 'inspect pcb') {
    navigate('/hardware')
    setTimeout(() => {
      setPcbCommand('reset')   // reset camera to isometric
      setPcbXray(true)         // enable X-Ray so board traces are visible
      setBpm(140)              // crank BPM for pulse visual
      setTimeout(() => setBpm(72), 4000)  // restore after 4s
    }, 350)
    return {
      output: [
        '→ PCB Lab: camera reset to isometric',
        '→ X-Ray mode: ON  (board body transparent)',
        '→ LED pulse: 140 BPM  (restoring 72 BPM in 4s)',
        '→ Heartrate sensor pads visible in X-Ray view',
      ],
    }
  }
  if (lower === 'inspect motor') {
    navigate('/hardware')
    return {
      output: [
        '── Custom 3-Phase BLDC Inrunner ──────────────',
        '  Topology : 9-pole stator / 16-pole rotor',
        '  Connect. : Wye (Star)',
        '  Winding  : 24 AWG enameled copper',
        '             ~200 turns/pole',
        '  Rₚₕ      : ~2.022 Ω (measured)',
        '  Stator   : Iron bolts (μᵣ ≈ 200)',
        '             Replaced PLA teeth (μᵣ ≈ 1)',
        '  Housing  : PETG HF  Tg ≈ 70°C',
        '             Upgraded from PLA+ Tg 55°C',
        '  MCU      : Arduino Uno — PWM via Servo.h',
        '  ESC      : Hobbywing Skywalker 30A V2',
        '── BOM Summary ───────────────────────────────',
        '  Budget   : $100.00 CAD',
        '  Final    : $94.92  CAD  ✓ under budget',
        '── Winding Fix ───────────────────────────────',
        '  Before   : ABCABCABC  — torque cancellation',
        '  After    : AaABbBCCC  — unified torque vector',
        '──────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'motor --theory') {
    return {
      output: [
        '── KV Rating, Inductance & Turn Count ────────',
        '  KV (RPM/V) is inversely proportional to the',
        '  number of turns per pole:',
        '',
        '    KV ∝ 1 / N',
        '',
        '  Fewer turns → lower winding inductance (L):',
        '',
        '    L ∝ N²  (solenoid approximation)',
        '',
        '  Lower L → faster current rise time → higher',
        '  electrical bandwidth → higher no-load RPM.',
        '',
        '  Trade-off: fewer turns = less back-EMF per',
        '  revolution = less torque per amp (Kt ∝ N).',
        '',
        '  This motor: ~200 T/pole (Wye) → moderate KV,',
        '  optimised for torque over raw speed.',
        '  Rₚₕ ≈ 2.022 Ω sets copper loss floor:',
        '    P_cu = I² × R  →  at 30A: ~1.82 kW dissipated',
        '──────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'gallery next') {
    navigate('/hardware')
    setTimeout(() => nextGallery(), 350)
    return { output: ['→ Cycling reference gallery…'] }
  }
  if (lower === 'cd audio') {
    dispatch({ type: 'SCROLL_TO', payload: 'audio' })
    return { output: ['→ Navigating to Audio Signal Chain…'] }
  }
  if (lower === 'cd vinyl') {
    navigate('/archive')
    return { output: ['→ Navigating to Vinyl Archive…'] }
  }
  if (lower === 'cd ecosort' || lower === 'cd systems') {
    navigate('/systems')
    return { output: ['→ Navigating to EcoSort / Systems…'] }
  }

  if (lower === 'inspect ecosort') {
    navigate('/hardware')
    return {
      output: [
        '── EcoSort Self-Test ─────────────────────────',
        '  [ INIT ]  Loading model manifest...      OK',
        '  [ CONN ]  Endpoint /api/classify...       OK',
        '  [ ENV  ]  ROBOFLOW_API_KEY bound...       OK',
        '  [ PREP ]  preprocessImage() 640×640...    OK',
        '  [ MODEL]  yolov8-trash-detections-kgnug v11',
        '  [ CONF ]  infer=35%  overlap=30%  display=35%',
        '  [ READY]  Drop an image to classify.',
        '──────────────────────────────────────────────',
        '  Classes : Can · Bottle · Glass · Paper · Cardboard',
        '            Battery · Food · Plastic bag · Styrofoam',
        '  Debug   : toggle "Debug Mode" to show sub-threshold boxes',
        '  Bins    : Returnables · Recycling · Compost · Garbage · E-Waste',
        '  Key     : ROBOFLOW_API_KEY — server env only, never client',
        '──────────────────────────────────────────────',
      ],
    }
  }

  if (lower === 'inspect ecosort --cv') {
    return {
      output: ['[SYSTEM LOG: ROBOFLOW API CONNECTED. CONFIDENCE THRESHOLD SET TO 25%.]'],
    }
  }

  if (lower === 'inspect ecosort --hardware') {
    return {
      output: ['[SYSTEM LOG: MICROCONTROLLER INITIALIZED. SERVO ACTUATOR CALIBRATED TO CENTER POS.]'],
    }
  }

  if (lower === 'ping ubco.ca') {
    const ms = () => (Math.random() * 8 + 10).toFixed(3)
    return {
      output: [
        'PING ubco.ca (142.55.34.12): 56 bytes of data',
        `64 bytes from 142.55.34.12: icmp_seq=0 ttl=55 time=${ms()} ms`,
        `64 bytes from 142.55.34.12: icmp_seq=1 ttl=55 time=${ms()} ms`,
        `64 bytes from 142.55.34.12: icmp_seq=2 ttl=55 time=${ms()} ms`,
        `64 bytes from 142.55.34.12: icmp_seq=3 ttl=55 time=${ms()} ms`,
        '--- ubco.ca ping statistics ---',
        '4 packets transmitted, 4 received, 0% packet loss',
      ],
    }
  }

  if (lower === 'git log') {
    return { output: FAKE_COMMITS }
  }

  if (lower === 'fortune') {
    return { output: [FORTUNES[Math.floor(Math.random() * FORTUNES.length)]] }
  }

  if (lower === 'history') {
    if (!commandRing.length) return { output: ['(no history yet)'] }
    return {
      output: [...commandRing].reverse().map((cmd, i) => `  ${String(i + 1).padStart(3)}  ${cmd}`),
    }
  }

  if (lower === 'sl' || lower === 'sl -al') {
    return {
      output: [
        '      ====        ________                ___________     ',
        '  _D _|  |_______/        \\__I_I_____===__|___________|   ',
        '   |(_)---  |   H\\________/ |   |        =|___ ___|       ',
        '   /     |  |   H  |  |     |   |         ||_| |_||       ',
        '  |      |  |   H  |__--------------------| [___] |       ',
        '  | ________|___H__/__|_____/[][]~\\_______|       |       ',
        '  |/ |   |-----------I_____I [][] []  D   |=======|__     ',
        '  \\_/ |___|          |_____| [] [] []  \\__/~\\___/   \\    ',
        '       \\___|  Choo choo! You meant  ls  :)           \\   ',
      ],
    }
  }

  if (lower === 'uname -a') {
    return {
      output: ['Linux ubco-eng 6.6.0-arch1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'],
    }
  }

  // set speed <rpm>
  const speedMatch = lower.match(/^set speed\s+(\d+)$/)
  if (speedMatch) {
    const key = speedMatch[1]
    const rpmVal = VALID_RPMS[key]
    if (rpmVal) {
      setRpm(rpmVal)
      return {
        output: [
          `→ Disc speed set to ${key === '33' ? '33⅓' : key} RPM`,
          `  Δω = ${((rpmVal / 60) * Math.PI * 2).toFixed(3)} rad/s`,
        ],
      }
    }
    return { output: [`set speed: invalid value "${speedMatch[1]}" — use 33, 45, or 78`] }
  }

  // set bpm <n>
  const bpmMatch = lower.match(/^set bpm\s+(\d+)$/)
  if (bpmMatch) {
    const val = parseInt(bpmMatch[1], 10)
    if (val >= 40 && val <= 180) {
      setBpm(val)
      return { output: [`→ BPM set to ${val}  (PCB trace pulse updated)`] }
    }
    return { output: [`set bpm: value must be between 40 and 180`] }
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
  const [hint,        setHint]        = useState('')

  const bodyRef   = useRef(null)   // the scrollable terminal body div
  const inputRef  = useRef(null)

  // Router
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // UIContext (scroll / highlight commands)
  const { dispatch, rpm } = useUI()

  // Zustand
  const history    = useAppStore((s) => s.terminalHistory)
  const commandRing = useAppStore((s) => s.commandRing)
  const pushCommand = useAppStore((s) => s.pushCommand)
  const pushHistory = useAppStore((s) => s.pushHistory)
  const clearHistory = useAppStore((s) => s.clearHistory)
  const setRpm        = useAppStore((s) => s.setRpm)
  const setBpm        = useAppStore((s) => s.setBpm)
  const nextGallery   = useAppStore((s) => s.nextGallery)
  const setPcbCommand = useAppStore((s) => s.setPcbCommand)
  const setPcbXray    = useAppStore((s) => s.setPcbXray)
  const setOverclock  = useAppStore((s) => s.setOverclock)

  // History cursor (local ref — not persisted, reset per session is correct)
  const cursor = useRef(-1)
  const navigateHistory = useCallback((direction) => {
    if (!commandRing.length) return null
    if (direction === 'up') cursor.current = Math.min(cursor.current + 1, commandRing.length - 1)
    else cursor.current = Math.max(cursor.current - 1, -1)
    return cursor.current === -1 ? '' : commandRing[cursor.current]
  }, [commandRing])

  // Breadcrumb prompt label — derived from pathname
  const routeLabel = pathname === '/' ? '~'
    : pathname.replace(/^\//, '')

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

  // Auto-scroll — scroll only within the terminal body, never the page
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeIndex, history, interactive])

  // Focus on interactive mode, and re-focus when navigating back to /
  useEffect(() => {
    if (interactive) inputRef.current?.focus()
  }, [interactive])

  useEffect(() => {
    if (interactive && pathname === '/') inputRef.current?.focus()
  }, [pathname, interactive])

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const entry = navigateHistory('up')
      if (entry !== null) { setInputValue(entry); setHint('') }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const entry = navigateHistory('down')
      if (entry !== null) { setInputValue(entry); setHint('') }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const result = autocomplete(inputValue)
      if (typeof result === 'string') {
        setInputValue(result)
        setHint('')
      } else if (Array.isArray(result)) {
        pushHistory({ cmd: inputValue, output: result })
        setHint('')
      }
    } else {
      cursor.current = -1
    }
  }

  function handleChange(e) {
    const val = e.target.value
    setInputValue(val)
    const result = autocomplete(val)
    setHint(typeof result === 'string' ? result.slice(val.length) : '')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const raw = inputValue.trim()
    if (!raw) return

    const result = parseCommand(raw, { dispatch, navigate, setRpm, setBpm, nextGallery, setPcbCommand, setPcbXray, setOverclock, commandRing })
    pushCommand(raw)
    setInputValue('')
    setHint('')

    if (!result) return
    if (result.clear) { clearHistory(); return }
    pushHistory({ cmd: raw, output: result.output })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.45 }}
      className="relative z-10 mx-6 mb-10 sm:mx-10 md:mx-16 lg:mx-24 max-w-2xl overflow-hidden"
      style={{ background: '#0b0805', border: '1px solid #281c10', borderRadius: 'var(--radius)' }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        {/* Dynamic breadcrumb */}
        <span className="ml-3 font-mono-data" style={{ color: '#58b8e0' }}>
          nic@ubco:{routeLabel} $
        </span>
        {interactive && (
          <span className="ml-auto font-mono-data flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {rpm === 33.333 ? '33⅓' : rpm} RPM
            </span>
            <span style={{ color: 'var(--accent)' }}>INTERACTIVE</span>
          </span>
        )}
      </div>

      {/* Body — scrollable container; scrollTop is driven by JS, not scrollIntoView */}
      <div
        ref={bodyRef}
        className="p-5 max-h-72 overflow-y-auto"
        onClick={() => interactive && inputRef.current?.focus()}
      >
        {/* Auto-play sessions */}
        {SESSIONS.slice(0, activeIndex + 1).map((session, i) => (
          <TerminalLine key={i} session={session} visible={i <= activeIndex} />
        ))}

        {/* Zustand-persisted interactive history */}
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
              {hint && (
                <span
                  className="absolute inset-0 font-mono-data pointer-events-none select-none"
                  style={{ color: 'var(--text-muted)', opacity: 0.45, fontSize: '0.875rem', lineHeight: 'inherit' }}
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
                style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}
                placeholder={hint ? '' : 'type "help" for commands'}
                autoComplete="off"
                spellCheck={false}
                aria-label="Terminal input"
              />
            </div>
          </form>
        )}

      </div>
    </motion.section>
  )
}
