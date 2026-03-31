// ─── Identity ─────────────────────────────────────────────────────────────────
export const profile = {
  name: 'Nic Piraino',
  tagline: 'Electrical Engineering Student & Hardware Enthusiast',
  location: 'Kelowna, BC',
  academics: {
    institution: 'UBCO',
    program: 'Electrical Engineering',
    teams: ['UBCO Rover Team', 'CIRC Competitor'],
  },
  github: 'https://github.com/NiccTM',
  interests: [
    'High-fidelity audio optimization',
    'VR hardware tuning',
    'Custom PC architectures',
  ],
}

// ─── Hardware Specs ───────────────────────────────────────────────────────────
export const hardware = {
  pc: {
    label: 'Main Rig',
    specs: [
      { key: 'CPU',    value: 'Ryzen 7 9800X3D' },
      { key: 'GPU',    value: 'Zotac RTX 3090 (2x 8-pin)' },
      { key: 'RAM',    value: '32GB DDR5 6000MHz CL30' },
      { key: 'Cooling',value: '360mm AIO' },
    ],
  },
  vr: {
    label: 'VR Setup',
    headsets: ['Meta Quest Pro', 'Oculus Rift S'],
  },
}

// ─── Audio Signal Chain (React Flow nodes) ───────────────────────────────────
export const audioChain = {
  nodes: [
    {
      id: 'source-vinyl',
      label: 'Rega Planar 2',
      type: 'source',
      specs: { Type: 'Turntable', Cartridge: 'Ortofon 2M Red' },
      position: { x: 0, y: 0 },
    },
    {
      id: 'source-digital',
      label: 'PC / Digital Source',
      type: 'source',
      specs: { Output: 'USB / Optical', 'Sample Rate': 'Up to 192kHz' },
      position: { x: 0, y: 120 },
    },
    {
      id: 'dac',
      label: 'Topping DX3 Pro+',
      type: 'dac',
      specs: {
        THD: '-120dB',
        SNR: '130dB',
        'Output Power': '1W @ 32Ω',
        Connectivity: 'USB / Optical / Coax',
      },
      position: { x: 280, y: 60 },
    },
    {
      id: 'amp',
      label: 'Audiolab 8200A',
      type: 'amp',
      specs: {
        Power: '60W RMS @ 8Ω',
        THD: '<0.002%',
        'Input Impedance': '47kΩ',
        'Damping Factor': '>200',
      },
      position: { x: 560, y: 60 },
    },
    {
      id: 'speakers',
      label: 'Martin Logan Motion 15i',
      type: 'output',
      specs: {
        'Freq Response': '60Hz – 25kHz',
        Sensitivity: '92dB',
        Impedance: '4Ω nominal',
        Tweeter: 'Folded Motion XT',
      },
      position: { x: 840, y: 0 },
    },
    {
      id: 'headphones',
      label: 'Sony MDR-Z7M2',
      type: 'output',
      specs: {
        Impedance: '70Ω',
        'Freq Response': '4Hz – 100kHz',
        Driver: '70mm HD dome',
        'Sensitivity': '100dB/mW',
      },
      position: { x: 840, y: 120 },
    },
  ],
  edges: [
    { id: 'e1', source: 'source-vinyl',   target: 'dac' },
    { id: 'e2', source: 'source-digital', target: 'dac' },
    { id: 'e3', source: 'dac',            target: 'amp' },
    { id: 'e4', source: 'amp',            target: 'speakers' },
    { id: 'e5', source: 'dac',            target: 'headphones' },
  ],
}

// ─── System Architecture — Feeble Presence (React Flow) ──────────────────────
export const feeblePresenceArch = {
  nodes: [
    {
      id: 'mm',
      label: 'MediaMonkey 5',
      type: 'app',
      specs: { Role: 'Media Player', Interface: 'COM/SDK Hooks', OS: 'Windows' },
      position: { x: 0, y: 60 },
    },
    {
      id: 'plugin',
      label: 'Feeble Presence Plugin',
      type: 'plugin',
      specs: { Language: 'Python', Polling: '2s interval', Data: 'Track, Artist, Album, Progress' },
      position: { x: 280, y: 60 },
    },
    {
      id: 'rpc',
      label: 'Discord IPC',
      type: 'ipc',
      specs: { Protocol: 'Local Named Pipe', Library: 'pypresence', Latency: '<50ms' },
      position: { x: 560, y: 0 },
    },
    {
      id: 'discord',
      label: 'Discord Client',
      type: 'output',
      specs: { Display: 'Rich Presence Card', Fields: 'State, Details, Timestamps, Cover Art' },
      position: { x: 840, y: 0 },
    },
  ],
  edges: [
    { id: 'e1', source: 'mm',     target: 'plugin' },
    { id: 'e2', source: 'plugin', target: 'rpc' },
    { id: 'e3', source: 'rpc',    target: 'discord' },
  ],
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = [
  {
    id: 'feeble-presence',
    title: 'Feeble Presence',
    description: 'Discord Rich Presence integration for MediaMonkey 5.',
    tags: ['Python', 'Discord API', 'MediaMonkey'],
    github: 'https://github.com/NiccTM/FeeblePresence',
    demo: 'architecture',
  },
  {
    id: 'ecosort',
    title: 'EcoSort',
    description: 'ML-based waste classifier (CMPE246). Roboflow object detection with drag-and-drop image inference.',
    tags: ['Python', 'ML', 'Roboflow', 'Computer Vision'],
    github: null,
    demo: 'ml',
  },
  {
    id: 'bldc-motor',
    title: 'Custom BLDC Motor',
    description: '3D-printed stator/rotor, custom winding, motor control electronics from scratch.',
    tags: ['Hardware', 'Electronics', '3D Printing', 'Motor Control'],
    github: null,
    demo: '3d',
  },
  {
    id: 'delorean-apsc171',
    title: 'APSC 171 DeLorean',
    role: 'Mechanical Team',
    description:
      'Complete SolidWorks recreation of the Back to the Future DeLorean. Focus on mechanical assembly, engine breakdown, and drivetrain modeling.',
    tags: ['SolidWorks', 'CAD', 'Mechanical Assembly', 'Drivetrain'],
    github: null,
    demo: 'video',
    video: '/videos/APSC 171-2024-T1C4-16-SW.mp4',
    poster: '/videos/delorean-poster.jpg',
    model: '/models/delorean-engine.glb',  // drop exported GLB here
  },
]

// ─── Social / External Links ──────────────────────────────────────────────────
export const socialLinks = [
  {
    id: 'github',
    label: 'GitHub',
    icon: 'code',
    url: 'https://github.com/NiccTM',
  },
]
