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
// category: 'competitive' | 'practice' | 'software'
export const projects = [
  // ── Competitive Design ────────────────────────────────────────────────────
  {
    id: 'unbox',
    category: 'competitive',
    title: 'UnBox — Sustainable Smart Packaging',
    course: 'APSC 169',
    description:
      'Circularly shipped, compostable, impact-resistant packaging for electronics e-commerce. Elongated rhombic dodecahedron geometry in PLA with integrated NFC tag for label-free shipping and circular return.',
    tags: ['3D Printing', 'PLA', 'NFC', 'Circular Design', 'Structural Analysis'],
    github: null,
    demo: null,
    awards: [
      { id: 'unbox-impact-gold',   label: '1st Place — Project Impact', tier: 'gold'   },
      { id: 'unbox-design-bronze', label: '3rd Place — Project Design', tier: 'bronze' },
    ],
    expandedDetails: {
      extendedDescription:
        'UnBox is a circularly shipped, compostable, and impact-resistant packaging solution designed to reduce single-use plastic waste in electronics e-commerce. The container utilizes an elongated rhombic dodecahedron geometry, manufactured from Polylactic Acid (PLA). This structure provides high rigidity, withstanding over 680 N (60 kg) of vertical force without permanent deformation, while allowing the boxes to tile efficiently during transit. The shell is secured using integrated 3D-printed edge clips.\n\nTo eliminate waste from traditional shipping labels and facilitate a circular return system, UnBox integrates a passive Near Field Communication (NFC) tag. Shipping details — including return address, recipient address, tracking number, and routing information — are stored directly on the tag and can be read or rewritten using a smartphone.',
      technicalSpecs: [
        { label: 'Material',           value: 'Polylactic Acid (PLA)' },
        { label: 'Geometry',           value: 'Elongated Rhombic Dodecahedron' },
        { label: 'Data integration',   value: 'Passive NFC Tag — NXP NTAG® 215 / 500-character capacity' },
        { label: 'Load capacity',      value: '> 680 N (> 60 kg) vertical crush resistance' },
        { label: 'Circularity',        value: '100% compostable — designed for 100–115 use cycles' },
        { label: 'Closure mechanism',  value: 'Integrated 3D-printed edge clips' },
        { label: 'Course',             value: 'APSC 169' },
      ],
      links: [],
    },
  },
  {
    id: 'firesense',
    category: 'competitive',
    title: 'FireSense — Wildfire Detection',
    course: 'APSC 171',
    description:
      'Autonomous early-warning architecture for remote wildfire monitoring. Sensor fusion across VOC/CO gas, IR thermal, and anemometer with multi-sensor consensus voting to eliminate false positives.',
    tags: ['Systems Design', 'Sensor Fusion', 'Embedded Systems', 'Satellite Comms', 'Technical Writing'],
    github: null,
    demo: null,
    awards: [
      { id: 'firesense-design-bronze', label: '3rd Place — Project Design', tier: 'bronze' },
    ],
    expandedDetails: {
      extendedDescription:
        'An autonomous early-warning architecture for remote wildfire monitoring. The system integrates the Bosch BME688 gas sensor (VOC/CO detection), IR thermal imaging, and anemometer data to distinguish true ignition events from false positives like sun glare or prescribed burns through a multi-sensor consensus voting logic.\n\nCommunication is optimized for extreme remote deployment using a satellite uplink as the primary backhaul, ensuring real-time telemetry transmission in regions lacking terrestrial infrastructure.\n\nDeliverables included a full systems architecture diagram and component selection rationale based on spectral sensitivity and BME688 gas-classification training.',
      technicalSpecs: [
        { label: 'Gas sensor',   value: 'Bosch BME688 — VOC / CO detection + gas classification' },
        { label: 'Deliverables', value: 'Systems architecture diagram + component selection rationale' },
        { label: 'Course',       value: 'APSC 171' },
      ],
      links: [],
    },
  },
  {
    id: 'delorean-apsc171',
    category: 'competitive',
    title: 'DMC DeLorean Assembly',
    course: 'APSC 171',
    role: 'Mechanical Team',
    description:
      'SolidWorks recreation of the Back to the Future DeLorean — 200+ unique parts with interactive Exploded View state. V6 engine assembly, component research, and full rendering in SolidWorks Visualize.',
    tags: ['SolidWorks', 'SolidWorks Visualize', 'CAD', 'V6 Engine', 'Research'],
    github: null,
    demo: 'video',
    video: '/videos/APSC 171-2024-T1C4-16-SW_cmp.mp4',
    poster: '/videos/delorean-poster.jpg',
    model: '/models/delorean-engine.glb',
    awards: [
      { id: 'delorean-finalist-cyan', label: 'Top 14 Finalist — Design Competition', tier: 'cyan' },
    ],
    expandedDetails: {
      extendedDescription:
        'A full SolidWorks multi-body assembly of the iconic DMC DeLorean, modelled from archival engineering drawings and reference photography. The project spanned 200+ individually constrained parts — body panels, gullwing door mechanisms, suspension geometry, and a complete PRV V6 engine sub-assembly.\n\nRendered at production quality in SolidWorks Visualize with environment lighting, material assignments, and an interactive Exploded View animation sequence. Placed in the Top 14 of the APSC 171 design competition across all cohort entries.',
      technicalSpecs: [
        { label: 'Tool',        value: 'SolidWorks 2024 + Visualize' },
        { label: 'Part count',  value: '200+ unique constrained parts' },
        { label: 'Engine',      value: 'PRV V6 sub-assembly' },
        { label: 'Features',    value: 'Exploded View animation, photo rendering' },
        { label: 'Role',        value: 'Mechanical Team' },
        { label: 'Course',      value: 'APSC 171' },
      ],
      links: [],
    },
  },

  // ── Professional Practice ─────────────────────────────────────────────────
  {
    id: 'consultation',
    category: 'practice',
    title: 'Indigenous Community Consultation',
    course: 'APSC 201',
    icon: 'gavel',
    description:
      'Policy framework for Gull Bay First Nation (Ontario) addressing Indigenous Community Consultation Policy (ICCP) — sustainable development, community engagement, and environmental stewardship.',
    tags: ['Policy Analysis', 'Stakeholder Engagement', 'Ethical Engineering', 'ICCP'],
    github: null,
    demo: null,
    awards: [
      { id: 'consultation-practice', label: 'Professional Practice', tier: 'practice' },
    ],
    expandedDetails: {
      extendedDescription:
        'A policy analysis and framework document developed for Gull Bay First Nation (Ontario) in the context of resource development decisions governed by the Indigenous Community Consultation Policy (ICCP). The work examined how engineers bear legal and ethical obligations to engage with affected communities before and during infrastructure projects.\n\nThe framework addressed Free, Prior and Informed Consent (FPIC), environmental stewardship principles, and practical consultation timelines. Deliverables included a structured policy recommendation report and an oral presentation to a simulated stakeholder panel.',
      technicalSpecs: [
        { label: 'Context',      value: 'Gull Bay First Nation, Ontario' },
        { label: 'Framework',    value: 'ICCP — Indigenous Community Consultation Policy' },
        { label: 'Principle',    value: 'FPIC (Free, Prior and Informed Consent)' },
        { label: 'Deliverables', value: 'Policy report + stakeholder presentation' },
        { label: 'Course',       value: 'APSC 201 — Engineering Professionalism' },
      ],
      links: [],
    },
  },
  {
    id: 'whistler',
    category: 'practice',
    title: 'Whistler Inclusive Theatre',
    icon: 'accessibility_new',
    description:
      'Comprehensive accessibility audit and Universal Design proposal for a multi-purpose theatre in Whistler, BC. Inclusive spatial design and stakeholder-focused technical report.',
    tags: ['Universal Design', 'Accessibility Standards', 'CAD (Spatial)', 'Technical Writing'],
    github: null,
    demo: null,
    awards: [],
    expandedDetails: {
      extendedDescription:
        'A Universal Design audit and retrofit proposal for a multi-purpose performing arts theatre in Whistler, BC. The project evaluated the existing facility against Canadian accessibility standards (CSA B651, BC Building Code) across twelve categories: entrances, seating, washrooms, wayfinding, acoustics, and emergency egress.\n\nThe final report proposed spatially specific design interventions — wider aisle clearances, distributed assistive listening system (ALS) coverage, tactile guide paths, and accessible service counter heights.',
      technicalSpecs: [
        { label: 'Standards',    value: 'CSA B651, BC Building Code Part 3' },
        { label: 'Audit scope',  value: '12 accessibility categories' },
        { label: 'ALS',          value: 'Assistive Listening System coverage mapping' },
        { label: 'Deliverable',  value: 'Technical report + stakeholder presentation' },
      ],
      links: [],
    },
  },

  // ── Software / Personal ───────────────────────────────────────────────────
  {
    id: 'feeble-presence',
    category: 'software',
    title: 'Feeble Presence',
    description: 'Discord Rich Presence integration for MediaMonkey 5.',
    tags: ['Python', 'Discord API', 'MediaMonkey'],
    github: 'https://github.com/NiccTM/Feeble_Presence',
    demo: 'architecture',
    awards: [],
    expandedDetails: {
      extendedDescription:
        'Feeble Presence is a MediaMonkey 5 plugin that bridges the desktop music player to Discord\'s Rich Presence API, letting your server see exactly what you\'re listening to in real time — track title, artist, album, and elapsed progress.\n\nThe plugin hooks into MediaMonkey\'s COM/SDK interface, polls playback state on a 2-second interval, and pushes updates over a local named pipe to the Discord IPC endpoint using the pypresence library. Round-trip latency from track change to visible Discord update is typically under 50 ms.',
      technicalSpecs: [
        { label: 'Language',    value: 'Python' },
        { label: 'Player',      value: 'MediaMonkey 5 (COM/SDK hooks)' },
        { label: 'IPC',         value: 'Discord local named pipe — pypresence' },
        { label: 'Polling',     value: '2s interval' },
        { label: 'Latency',     value: '<50ms track-change → Discord update' },
        { label: 'Fields',      value: 'State, Details, Timestamps, Cover Art' },
      ],
      links: [
        { label: 'GitHub', url: 'https://github.com/NiccTM/Feeble_Presence', icon: 'open_in_new' },
      ],
    },
  },
  {
    id: 'ecosort',
    category: 'software',
    title: 'EcoSort',
    description: 'Real-time computer vision pipeline for automated waste stream segregation. Custom YOLOv8 model on Roboflow with hardware actuation via servo-driven diverter flap.',
    tags: ['React', 'YOLOv8', 'Roboflow', 'Computer Vision', 'Vercel', 'PWM', 'Servo', 'Hardware'],
    github: 'https://github.com/NiccTM/CMPE246_G16_Trash_Organizer',
    demo: 'ml',
    awards: [],
    expandedDetails: {
      extendedDescription:
        'A real-time computer vision pipeline for automated waste stream segregation using a custom-trained YOLOv8 model hosted on a Roboflow inference endpoint. The frontend performs a center-square crop to 640×640, encodes the frame as base64, and sends it to the inference API — back-mapping returned bounding box coordinates through the crop transform to the original image space for pixel-accurate overlay rendering.\n\nFull-Stack Pipeline: Built with React and Framer Motion for a low-latency UI, backed by a Vercel serverless function that proxies the API key and enforces per-IP and global rate limits.\n\nHardware Actuation: Classification outputs drive a servo-driven diverter flap via PWM, physically routing items into compost, recycle, or landfill bins.',
      technicalSpecs: [
        { label: 'Model',         value: 'YOLOv8 — yolov8-trash-detections-kgnug v11' },
        { label: 'Inference',     value: 'Roboflow hosted API — confidence 25%, overlap 30%' },
        { label: 'Preprocessing', value: 'Center-square crop → 640×640 JPEG' },
        { label: 'Coord mapping', value: 'RF 640-space → crop offset → original → display px' },
        { label: 'Backend',       value: 'Vercel serverless — rate limit 5 req/IP/hr' },
        { label: 'Frontend',      value: 'React + Framer Motion, CSS absolute bounding boxes' },
        { label: 'MCU',           value: 'Microcontroller — servo PWM actuation' },
        { label: 'Actuator',      value: 'Servo-driven diverter flap — center pos calibrated' },
        { label: 'Course',        value: 'CMPE246' },
      ],
      subSystems: [
        {
          id:          'vision',
          title:       'Sub-System 1: Vision & ML Pipeline',
          icon:        'visibility',
          description: 'Integration of Roboflow API for real-time bounding box detection and classification.',
          images: [],
        },
        {
          id:          'electronics',
          title:       'Sub-System 2: Control Electronics',
          icon:        'memory',
          description: 'Microcontroller logic processing classification outputs to drive physical actuators.',
          images: [
            { src: '/20260321_172148.jpg', label: 'UBCO Bin Reference',        caption: 'Target bins — garbage, recycle, returnables, compost, e-waste' },
            { src: '/20260321_200413.jpg', label: 'Detection Test — Red Bull', caption: 'Live Roboflow inference on returnable can' },
          ],
        },
        {
          id:          'mechanical',
          title:       'Sub-System 3: Mechanical Assembly',
          icon:        'settings',
          description: 'Custom diverter mechanism routing items to respective waste bins based on servo positioning.',
          images: [
            { src: '/20260321_210541.jpg', label: 'Background Substitution Test', caption: 'UI calibration — background subtraction frame capture' },
            { src: '/20260321_210639.jpg', label: 'LCD Screen Test',              caption: 'LCD display output — classification result readout' },
          ],
        },
      ],
      links: [
        { label: 'GitHub', url: 'https://github.com/NiccTM/CMPE246_G16_Trash_Organizer', icon: 'open_in_new' },
      ],
    },
  },
  {
    id: 'bldc-motor',
    category: 'software',
    title: 'Custom 3-Phase High-Speed BLDC Inrunner',
    description: '9-pole stator / 16-pole rotor wound with 24 AWG enameled copper. Engineered within a $100 CAD budget using Arduino Uno PWM control and a Hobbywing Skywalker 30A ESC.',
    tags: ['Hardware', 'Electronics', '3D Printing', 'Motor Control', 'BLDC', 'ESC'],
    github: null,
    demo: '3d',
    awards: [],
    expandedDetails: {
      extendedDescription:
        'A ground-up 3-phase brushless DC inrunner motor engineered without any off-the-shelf motor components. The 9-pole stator and 16-pole rotor were designed in CAD and 3D-printed — initially in PLA, then upgraded to PETG HF after thermal analysis revealed PLA+ would approach its glass transition temperature (55°C) under the 30A draw required for target torque.\n\nThe winding geometry went through two major iterations. The initial ABCABCABC sequence produced torque cancellation and oscillation; redesigning to AaABbBCCC unified the magnetic torque vectors and eliminated the instability. Stator teeth were replaced mid-project with iron bolts to concentrate flux and increase torque density — a direct response to the poor relative permeability (≈1) of PLA. The full BOM was engineered to $94.92 CAD against a $100 target.',
      technicalSpecs: [
        { label: 'Topology',         value: '3-phase inrunner — 9-pole stator / 16-pole rotor' },
        { label: 'Connection',       value: 'Wye (Star)' },
        { label: 'Winding',          value: '24 AWG enameled copper — ~200 turns/pole' },
        { label: 'Phase resistance', value: '~2.022 Ω' },
        { label: 'Stator teeth',     value: 'Iron bolts (replaced PLA — μᵣ ≈ 1 → high flux density)' },
        { label: 'Rotor / base',     value: 'PETG HF (Tg ≈ 70°C — upgraded from PLA+ Tg 55°C)' },
        { label: 'Control MCU',      value: 'Arduino Uno — PWM via Servo.h' },
        { label: 'ESC',              value: 'Hobbywing Skywalker 30A V2' },
        { label: 'BOM total',        value: '$94.92 CAD (budget: $100)' },
      ],
      links: [],
    },
  },
]

// ─── Water Contact Sensor — UAS Aerospace Team ───────────────────────────────
export const waterSenseAerospace = {
  title:       '2nd Year UAS Aerospace Team: Water Contact Sensor',
  descriptor:  'Schematic capture and PCB layout for a drone-mounted water detection system.',
  application: 'Detects when a tube extended from a UAV successfully contacts water inside a target barrel.',
  team:        'UBCO UAS Aerospace Team — 2nd Year',
  images: {
    schematic: {
      src:     '/Water_Sense_AerospaceTeam_SCH.jpg',
      label:   'Schematic Capture',
      caption: 'Full schematic — sensor circuit, signal conditioning, connector pinout',
    },
    pcb: {
      src:     '/Water_Sense_AerospaceTeam_PCB.jpg',
      label:   'PCB Layout',
      caption: 'Altium PCB layout — component placement and routing',
    },
  },
  technicalSpecs: [
    { label: 'Application', value: 'UAV tube-water contact detection in target barrel' },
    { label: 'Tool',        value: 'KiCad 7.0' },
    { label: 'Focus',       value: 'Schematic capture + PCB layout' },
    { label: 'Team',        value: 'UBCO UAS Aerospace Team' },
    { label: 'Year',        value: '2nd Year Engineering' },
  ],
}

// ─── Archive Modules ──────────────────────────────────────────────────────────
export const archiveData = [
  {
    id:         'hifi-audio',
    module:     2,
    title:      'High-Fidelity Audio',
    descriptor: 'Analog and digital lossless audio hardware chain.',
    spec:       'Rega Planar 2 · Creek CD43 MK2 · Luxman K-202 Cassette Deck',
    icon:       'speaker',
    images: [
      {
        src:     '/RegaP2_CreekCD43MK2_LuxmanK202.jpg',
        label:   'Rega P2 · Creek CD43 MK2 · Luxman K-202',
        caption: 'Bedroom signal chain — turntable, CD player, cassette deck',
      },
      {
        src:     '/RegaP2_VINYL.jpg',
        label:   'Rega Planar 2 + Vinyl',
        caption: 'AT-VM95ML cartridge · belt-drive deck · 33⅓ RPM',
      },
    ],
  },
  {
    id:         'workshop',
    module:     6,
    title:      'Workshop Infrastructure',
    descriptor: 'Collaborative mechanical fabrication and workstation infrastructure.',
    spec:       'Collaborative structural fabrication.',
    icon:       'handyman',
    images: [
      {
        src:     '/Built_WoodWorkBench.jpg',
        label:   'Heavy-Duty Workbench',
        caption: 'Co-built with EE housemate · supports mechanical + electronics testing loads',
      },
    ],
  },
]

// ─── Hardware Diagnostics & Repair ───────────────────────────────────────────
export const hardwareDiagnostics = {
  title:      'Hardware Diagnostics & Repair',
  descriptor: 'Solder reflow, fan replacement, thermal paste, and Windows-level software repair.',
  spec:       'Component-level repair — solder, thermal, mechanical, OS.',
  categories: [
    {
      key:         'compute',
      label:       'Compute',
      icon:        'computer',
      description: 'Laptop teardowns and logic board diagnostics.',
      images: [
        { src: '/ASUS_gaming_laptop.jpg', label: 'ASUS ROG Gaming Laptop', caption: 'Thermal paste reapplication · heatsink inspection' },
        { src: '/MSI_gaming_laptop.jpg',  label: 'MSI Gaming Laptop',     caption: 'Logic board diagnostics · power rail trace' },
        { src: '/ASUS_laptop.jpg',        label: 'ASUS Laptop',           caption: 'Motherboard-level component inspection' },
        { src: '/Acer_laptop.jpg',        label: 'Acer Laptop',           caption: 'Teardown · connector and trace audit' },
        { src: '/Zotac_RTX3090.jpg',      label: 'Zotac RTX 3090',        caption: 'GPU VRAM inspection · thermal pad replacement' },
      ],
    },
    {
      key:         'analog',
      label:       'Analog',
      icon:        'speaker',
      description: 'Amplifier internal inspection and component replacement.',
      images: [
        { src: '/beats_headphone.jpg', label: 'Beats Headphone', caption: 'Driver inspection · cable re-termination' },
      ],
    },
    {
      key:         'digital',
      label:       'Digital',
      icon:        '_sacd',
      description: 'Optical drive (DVD/SACD) and DAC servicing.',
      images: [
        { src: '/DVD_player.jpg', label: 'DVD Player', caption: 'Laser sled cleaning · mechanism lubrication' },
      ],
    },
  ],
}

// ─── Contact ──────────────────────────────────────────────────────────────────
export const contact = {
  email: 'nicpiraino@proton.me',
}

// ─── Social / External Links ──────────────────────────────────────────────────
export const socialLinks = [
  {
    id: 'github',
    label: 'GitHub',
    icon: 'code',
    url: 'https://github.com/NiccTM',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'person',
    url: 'https://www.linkedin.com/in/nic-piraino/',
  },
  {
    id: 'discogs',
    label: 'Discogs',
    icon: 'album',
    url: 'https://www.discogs.com/user/NiccTM',
  },
]
