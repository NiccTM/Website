// ─── Identity ─────────────────────────────────────────────────────────────────
export const profile = {
  name: 'Nic Piraino',
  tagline: 'Electrical Engineering Student & Vinyl Collector',
  location: 'Kelowna, BC',
  academics: {
    institution: 'UBCO',
    program: 'Electrical Engineering',
    teams: ['UBCO Rover Team', 'CIRC Competitor'],
  },
  github: 'https://github.com/NiccTM',
  interests: [
    'Vinyl collecting — jazz, pop, rock, R&B, rap, trap',
    'High-fidelity audio',
    'VR hardware',
    'Custom PC builds',
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

// ─── Audio Signal Chains (React Flow — per room) ─────────────────────────────
export const audioChain = {
  rooms: [
    // ── House Master ──────────────────────────────────────────────────────────
    {
      id: 'house-master',
      label: 'House Master',
      nodes: [
        {
          id: 'hm-beosound',
          label: 'B&O Beosound 4',
          type: 'streamer',
          room: 'House Master',
          specs: { Type: 'All-in-one CD/Radio/Streaming', Brand: 'Bang & Olufsen' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'hm-beocord',
          label: 'B&O Beocord 5500',
          type: 'tape',
          room: 'House Master',
          specs: { Type: 'Cassette Deck', Brand: 'Bang & Olufsen', Heads: '3-head' },
          position: { x: 0, y: 110 },
        },
        {
          id: 'hm-amp',
          label: 'Audiolab 8200A',
          type: 'amp',
          room: 'House Master',
          specs: {
            Power: '60W RMS @ 8Ω',
            THD: '<0.002%',
            'Input Impedance': '47kΩ',
            'Damping Factor': '>200',
          },
          position: { x: 300, y: 55 },
        },
        {
          id: 'hm-speakers',
          label: 'Martin Logan Motion 15i',
          type: 'output',
          room: 'House Master',
          specs: {
            'Freq Response': '60Hz – 25kHz',
            Sensitivity: '92dB',
            Impedance: '4Ω nominal',
            Tweeter: 'Folded Motion XT',
          },
          position: { x: 580, y: 0 },
        },
        {
          id: 'hm-sub',
          label: 'Martin Logan Dynamo 300',
          type: 'sub',
          room: 'House Master',
          specs: {
            Type: 'Powered Subwoofer',
            Driver: '8" long-throw',
            Power: '120W RMS',
            'Freq Response': '32Hz – 120Hz',
          },
          position: { x: 580, y: 110 },
        },
        {
          id: 'hm-headphones',
          label: 'Sony MDR-Z7Mk2',
          type: 'output',
          room: 'House Master',
          specs: {
            Impedance: '70Ω',
            'Freq Response': '4Hz – 100kHz',
            Driver: '70mm HD dome',
            Sensitivity: '100dB/mW',
          },
          position: { x: 580, y: 210 },
        },
      ],
      edges: [
        { id: 'hm-e1', source: 'hm-beosound', target: 'hm-amp' },
        { id: 'hm-e2', source: 'hm-beocord',  target: 'hm-amp' },
        { id: 'hm-e3', source: 'hm-amp',       target: 'hm-speakers' },
        { id: 'hm-e4', source: 'hm-amp',       target: 'hm-sub' },
        { id: 'hm-e5', source: 'hm-amp',       target: 'hm-headphones' },
      ],
    },

    // ── Bedroom ───────────────────────────────────────────────────────────────
    {
      id: 'bedroom',
      label: 'Bedroom',
      nodes: [
        {
          id: 'bd-turntable',
          label: 'Rega Planar 2',
          type: 'source',
          room: 'Bedroom',
          specs: { Cartridge: 'Audio-Technica AT-VM95ML', Type: 'Belt-drive turntable' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'bd-cd',
          label: 'Creek CD43 Mk2',
          type: 'cd',
          room: 'Bedroom',
          specs: { Type: 'CD Player', Output: 'RCA / S/PDIF', DAC: 'Wolfson WM8740' },
          position: { x: 0, y: 110 },
        },
        {
          id: 'bd-luxman',
          label: 'Luxman K-205',
          type: 'tape',
          room: 'Bedroom',
          specs: { Type: 'Cassette Deck', Heads: '3-head', 'Noise Reduction': 'Dolby B/C' },
          position: { x: 0, y: 220 },
        },
        {
          id: 'bd-phono',
          label: 'Rega Fono Mini A2D',
          type: 'preamp',
          room: 'Bedroom',
          specs: { Type: 'MM Phono Preamp', 'USB A/D': 'Yes', 'Input Impedance': '47kΩ' },
          position: { x: 260, y: 0 },
        },
        {
          id: 'bd-amp',
          label: 'NAD D 3020 V2',
          type: 'amp',
          room: 'Bedroom',
          specs: {
            Power: '30W RMS @ 8Ω',
            Connectivity: 'Bluetooth / Optical / USB',
            THD: '<0.03%',
          },
          position: { x: 520, y: 90 },
        },
        {
          id: 'bd-speakers',
          label: 'KEF Q350',
          type: 'output',
          room: 'Bedroom',
          specs: {
            'Freq Response': '63Hz – 28kHz',
            Sensitivity: '87dB',
            Impedance: '8Ω',
            Driver: 'Uni-Q 6.5"',
          },
          position: { x: 780, y: 40 },
        },
        {
          id: 'bd-sub',
          label: 'SVS 3000 Micro',
          type: 'sub',
          room: 'Bedroom',
          specs: {
            Type: 'Sealed Powered Subwoofer',
            Driver: 'Dual 8" opposed',
            Power: '800W RMS',
            'Freq Response': '25Hz – 200Hz',
          },
          position: { x: 780, y: 150 },
        },
      ],
      edges: [
        { id: 'bd-e1', source: 'bd-turntable', target: 'bd-phono' },
        { id: 'bd-e2', source: 'bd-phono',     target: 'bd-amp' },
        { id: 'bd-e3', source: 'bd-cd',         target: 'bd-amp' },
        { id: 'bd-e4', source: 'bd-luxman',     target: 'bd-amp' },
        { id: 'bd-e5', source: 'bd-amp',        target: 'bd-speakers' },
        { id: 'bd-e6', source: 'bd-amp',        target: 'bd-sub' },
      ],
    },

    // ── Upstairs ──────────────────────────────────────────────────────────────
    {
      id: 'upstairs',
      label: 'Upstairs',
      nodes: [
        {
          id: 'up-turntable',
          label: 'AT-LP120-USB',
          type: 'source',
          room: 'Upstairs',
          specs: { Type: 'Direct-drive turntable', Output: 'RCA / USB', 'Built-in Preamp': 'Yes' },
          position: { x: 0, y: 60 },
        },
        {
          id: 'up-receiver',
          label: 'Pioneer VSX-831',
          type: 'amp',
          room: 'Upstairs',
          specs: {
            Power: '80W × 5 @ 8Ω',
            Type: 'AV Receiver',
            Connectivity: 'HDMI / Bluetooth / Phono',
          },
          position: { x: 280, y: 60 },
        },
        {
          id: 'up-speakers',
          label: 'Ruark Epilogue 2',
          type: 'output',
          room: 'Upstairs',
          specs: {
            Type: 'Bookshelf',
            Impedance: '8Ω',
            Sensitivity: '88dB',
          },
          position: { x: 560, y: 0 },
        },
        {
          id: 'up-sub',
          label: 'Polk 12" Sub',
          type: 'sub',
          room: 'Upstairs',
          specs: { Driver: '12" woofer', Type: 'Powered Subwoofer' },
          position: { x: 560, y: 120 },
        },
      ],
      edges: [
        { id: 'up-e1', source: 'up-turntable', target: 'up-receiver' },
        { id: 'up-e2', source: 'up-receiver',  target: 'up-speakers' },
        { id: 'up-e3', source: 'up-receiver',  target: 'up-sub' },
      ],
    },
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
      'SolidWorks recreation of the Back to the Future DeLorean. Responsible for V6 engine assembly, component research, and all rendering in SolidWorks Visualize.',
    tags: ['SolidWorks', 'SolidWorks Visualize', 'CAD', 'V6 Engine', 'Research'],
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
