import { useRef, useEffect, Suspense, useCallback } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, Bounds, useBounds } from '@react-three/drei'
// EffectComposer/Bloom removed â€” @react-three/postprocessing has version conflicts that crash the Canvas
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useState } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'
import ErrorBoundary  from '../components/ui/ErrorBoundary'
import ImageLightbox  from '../components/ui/ImageLightbox'
import { REFERENCE_IMAGES } from '../components/hardware/ReferenceGallery'
import MotorLab       from '../components/hardware/MotorLab'
import WaterSenseDive from '../components/hardware/WaterSenseDive'


useGLTF.preload('/PCB.gltf')

// â”€â”€â”€ Camera presets (unit direction vectors â€” distance computed by Bounds.fit) â”€
const CAM_DIRS = {
  topdown:   new THREE.Vector3(0,    1,     0.001),
  isometric: new THREE.Vector3(1,    1,     1    ),
  bottom:    new THREE.Vector3(0,   -1,     0.001),
  reset:     new THREE.Vector3(0.5,  0.8,   1    ),
}

// â”€â”€â”€ BPM pulse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function bpmPhase(elapsedSecs, bpm) {
  const t = (elapsedSecs % (60 / bpm)) / (60 / bpm)
  return Math.max(0, Math.sin(t * Math.PI * 2)) ** 2
}

// â”€â”€â”€ Camera controller (must live inside <Bounds> to use useBounds) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CameraController() {
  const { camera, controls } = useThree()
  const bounds        = useBounds()
  const pcbCommand    = useAppStore((s) => s.pcbCommand)
  const setPcbCommand = useAppStore((s) => s.setPcbCommand)

  useEffect(() => {
    if (!pcbCommand) return
    const dir = (CAM_DIRS[pcbCommand] ?? CAM_DIRS.reset).clone().normalize()
    camera.position.copy(dir.multiplyScalar(10))
    camera.lookAt(0, 0, 0)
    bounds.refresh().clip().fit()
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
    setPcbCommand(null)
  }, [pcbCommand, bounds, camera, controls, setPcbCommand])

  return null
}

// â”€â”€â”€ PCB model â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PCBModel({ xray }) {
  const { scene } = useGLTF('/PCB.gltf')
  const bpm       = useAppStore((s) => s.bpm)
  const { clock } = useThree()

  const boardMat = useRef(null)
  const ledMats  = useRef([])
  const primed   = useRef(false)

  useEffect(() => {
    if (primed.current) return
    primed.current = true

    scene.traverse((obj) => {
      if (!obj.isMesh) return
      if (!obj.name.startsWith('Open CASCADE')) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      const cloned = mats.map((m) => {
        const c = m.clone()
        c.polygonOffset = true; c.polygonOffsetFactor = -1
        // Boost reflectivity for Frutiger Aero glass-metal aesthetic
        if (c.metalness !== undefined) c.metalness = Math.max(c.metalness, 0.72)
        if (c.roughness !== undefined) c.roughness = Math.min(c.roughness, 0.28)
        return c
      })
      obj.material = cloned.length === 1 ? cloned[0] : cloned
      boardMat.current = cloned
    })

    const collected = []
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return
      let p = obj.parent; let underLED = false
      while (p) { if (p.name === 'WP7113') { underLED = true; break }; p = p.parent }
      if (!underLED) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      const cloned = mats.map((m) => {
        const c = m.clone()
        if (c.color.r > 0.9 && c.color.g > 0.9 && c.color.b > 0.9) {
          c.emissive = new THREE.Color(1, 0.95, 0.8); c.emissiveIntensity = 0
        }
        return c
      })
      obj.material = cloned.length === 1 ? cloned[0] : cloned
      cloned.forEach((m) => { if (m.color.r > 0.9 && m.color.g > 0.9 && m.color.b > 0.9) collected.push(m) })
    })
    ledMats.current = collected
  }, [scene])

  useEffect(() => {
    if (!boardMat.current) return
    boardMat.current.forEach((m) => {
      m.transparent = xray; m.opacity = xray ? 0.18 : 1.0; m.needsUpdate = true
    })
  }, [xray])

  useFrame(() => {
    if (!ledMats.current.length) return
    const pulse = bpmPhase(clock.elapsedTime, bpm)
    for (const m of ledMats.current) m.emissiveIntensity = 0.05 + pulse * 4.0
  })

  return <primitive object={scene} />
}

// â”€â”€â”€ Scene â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PCBScene({ xray }) {
  return (
    <>
      <Environment preset="city" environmentIntensity={0.65} />
      <ambientLight intensity={0.3} color="#001B3D" />
      <directionalLight position={[4, 6, 4]} intensity={1.2} color="#00E5FF" />
      <directionalLight position={[-3, 4, -2]} intensity={0.55} color="#00FFAA" />
      <directionalLight position={[0, -3, 2]} intensity={0.18} color="#00E5FF" />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={0.01}
        maxDistance={5.0}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.6}
        autoRotate
        autoRotateSpeed={0.6}
        touches={{ ONE: 0 /* ROTATE */, TWO: 2 /* DOLLY_PAN */ }}
        enableDamping
        dampingFactor={0.08}
      />

      <Bounds fit clip margin={1.4} observe>
        <CameraController />
        <Suspense fallback={null}>
          <PCBModel xray={xray} />
        </Suspense>
      </Bounds>
    </>
  )
}

// â”€â”€â”€ BPM controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BpmDot({ bpm }) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      setActive(true); setTimeout(() => setActive(false), 120)
    }, (60 / bpm) * 1000)
    return () => clearInterval(id)
  }, [bpm])
  return (
    <span className="inline-block w-2 h-2 rounded-full transition-all duration-75"
      style={{ background: active ? 'var(--accent)' : 'var(--text-muted)', opacity: active ? 1 : 0.35, transform: active ? 'scale(1.4)' : 'scale(1)' }} />
  )
}

function BpmControl() {
  const bpm = useAppStore((s) => s.bpm); const setBpm = useAppStore((s) => s.setBpm)
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono-data text-xs select-none" style={{ color: 'var(--text-muted)' }}>BPM</span>
      <input type="range" min={40} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
        className="w-24 accent-emerald-400" aria-label="BPM" />
      <span className="font-mono-data text-xs w-7 text-right tabular-nums" style={{ color: 'var(--accent)' }}>{bpm}</span>
      <BpmDot bpm={bpm} />
    </div>
  )
}

// â”€â”€â”€ Reference Gallery strip (horizontal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReferenceGalleryStrip({ onSyncView }) {
  const [lightbox, setLightbox] = useState(null)
  const rawIndex       = useAppStore((s) => s.galleryIndex)
  const setActiveIndex = useAppStore((s) => s.setGalleryIndex)
  const activeIndex    = Math.min(rawIndex, REFERENCE_IMAGES.length - 1)

  function handleClick(img, idx) {
    setActiveIndex(idx)
    if (img.view && onSyncView) onSyncView(img.view)
  }

  return (
    <div className="mt-6">
      {/* Strip header */}
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden="true" className="material-symbols-rounded text-sm" style={{ color: 'var(--accent)' }}>photo_library</span>
        <p className="font-mono-data text-xs tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Altium Reference Gallery
        </p>
        <div className="flex-1 h-px ml-2" style={{ background: 'var(--border)' }} />
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
          Click to sync 3D view Â· Hover to zoom
        </p>
      </div>

      {/* Horizontal thumbnail row */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {REFERENCE_IMAGES.map((img, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="relative group cursor-pointer rounded-lg overflow-hidden border shrink-0"
            style={{
              width: '220px',
              borderColor: i === activeIndex ? 'var(--accent)' : 'var(--border)',
              boxShadow:   i === activeIndex ? '0 0 0 1px var(--accent)' : 'none',
            }}
            onClick={() => handleClick(img, i)}
          >
            <img
              src={img.src}
              alt={img.label}
              className="w-full object-cover transition-all duration-200"
              style={{
                aspectRatio: '16/9',
                filter: i === activeIndex ? 'none' : 'grayscale(0.5) brightness(0.8)',
              }}
            />

            {/* Zoom overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'rgba(3,7,18,0.45)' }}
              onClick={(e) => { e.stopPropagation(); setLightbox(img) }}

            >
              <span aria-hidden="true" className="material-symbols-rounded text-2xl" style={{ color: 'var(--accent)' }}>zoom_in</span>
            </div>

            {/* Label gradient */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
              style={{ background: 'linear-gradient(transparent, rgba(3,7,18,0.85))' }}>
              <p className="font-mono-data text-xs" style={{ color: 'var(--text-primary)' }}>{img.label}</p>
            </div>

            {/* Active badge */}
            {i === activeIndex && (
              <div className="absolute top-2 right-2">
                <span className="font-mono-data text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(6,95,70,0.7)', color: 'var(--accent)' }}>ACTIVE</span>
              </div>
            )}

            {/* Sync icon */}
            {img.view && (
              <div className="absolute top-2 left-2">
                <span aria-hidden="true" className="material-symbols-rounded text-sm"
                  style={{ color: 'var(--accent)', opacity: 0.7 }}>sync</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Caption for active image */}
      <p className="font-mono-data text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--text-primary)' }}>{REFERENCE_IMAGES[activeIndex].label}</span>
        &nbsp;Â·&nbsp;{REFERENCE_IMAGES[activeIndex].caption}
      </p>

      <AnimatePresence>
        {lightbox && <ImageLightbox src={lightbox.src} label={lightbox.label} caption={lightbox.caption} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function HardwarePage() {
  usePageMeta('Hardware Lab', 'Interactive 3D PCB digital twin, BLDC motor deep-dive, and UAS aerospace water contact sensor â€” hardware engineering in Altium Designer and embedded C.')
  const [canvasActive, setCanvasActive] = useState(false)

  // xray is now in the global store so the terminal can toggle it
  const xray      = useAppStore((s) => s.pcbXray)
  const setXray   = useAppStore((s) => s.setPcbXray)
  const setPcbCommand = useAppStore((s) => s.setPcbCommand)

  const handleSyncView = useCallback((view) => {
    if (view === 'topdown') setXray(true)
    setPcbCommand(view)
  }, [setPcbCommand, setXray])

  return (
    <section className="relative z-10 px-5 pt-8 pb-4 sm:px-8 md:px-14 lg:px-20 xl:px-28 tv:px-40" id="section-hardware">

      {/* â”€â”€ Header â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-5"
      >
        <div>
          <h2 className="font-mono-data tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            PCB Lab â€” Digital Twin
          </h2>
          <p className="font-sans text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Heartrate PCB Â· Altium Designer 24 Â· Drag to orbit Â· Scroll to zoom
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => { setPcbCommand('reset'); setXray(false) }}
            className="flex items-center gap-1.5 font-mono-data text-xs px-3 py-2 rounded-lg border-subtle transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">center_focus_strong</span>
            Reset
          </button>

          <button
            onClick={() => setXray((x) => !x)}
            className="flex items-center gap-2 font-mono-data text-xs px-3 py-2 rounded-lg border-subtle transition-colors duration-150"
            style={{ color: xray ? 'var(--accent)' : 'var(--text-muted)', background: xray ? 'rgba(58,144,184,0.18)' : 'var(--bg-surface-2)' }}
            aria-pressed={xray}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">{xray ? 'visibility' : 'visibility_off'}</span>
            X-Ray
          </button>

          <BpmControl />
        </div>
      </motion.div>

      {/* â”€â”€ PCB Digital Twin â€” full width â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="relative w-full aspect-video sm:aspect-auto sm:h-[60vh] sm:max-h-[820px] rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(0,229,255,0.15)', background: 'rgba(2,13,26,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      >
        {canvasActive ? (
          <ErrorBoundary label="PCB Canvas" fallback={(err) => (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <span aria-hidden="true" className="material-symbols-rounded text-4xl" style={{ color: 'var(--accent)' }}>memory</span>
              <p className="font-mono-data text-sm text-center max-w-xs" style={{ color: 'var(--text-primary)' }}>
                Failed to load 3D viewer
              </p>
              <p className="font-mono-data text-sm text-center max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                {err?.message || 'WebGL error â€” try refreshing the page'}
              </p>
            </div>
          )}>
            <Canvas
              gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
              dpr={[1, 2]}
              camera={{ position: [1, 1.2, 1.8], fov: 45 }}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
              <PCBScene xray={xray} />
            </Canvas>
          </ErrorBoundary>
        ) : (
          /* Inactive placeholder â€” zero GPU cost */
          <div
            className="relative flex items-center justify-center h-full cursor-pointer group overflow-hidden"
            style={{ background: 'transparent' }}
            onClick={() => setCanvasActive(true)}
          >
            {/* PCB preview photo */}
            <img
              src="/Screenshot 2026-03-31 125242.png"
              alt="PCB preview"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
              style={{ filter: 'brightness(0.35) saturate(0.6)' }}
            />

            {/* Click-to-activate overlay */}
            <div className="relative flex flex-col items-center gap-4 z-10">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 group-hover:scale-110"
                style={{ background: 'rgba(88,184,224,0.18)', border: '1px solid rgba(88,184,224,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                <span aria-hidden="true" className="material-symbols-rounded text-3xl" style={{ color: '#58b8e0' }}>play_arrow</span>
              </div>
              <div className="text-center">
                <p className="font-mono-data text-sm" style={{ color: 'var(--text-primary)' }}>
                  Click to activate 3D viewer
                </p>
                <p className="font-mono-data text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  PCB.gltf Â· WebGL Â· Interactive
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pause button â€” visible only when canvas is running */}
        {canvasActive && (
          <button
            onClick={() => setCanvasActive(false)}
            className="absolute top-3 right-3 flex items-center gap-1.5 font-mono-data text-xs px-3 py-1.5"
            style={{
              background: 'rgba(13,13,13,0.80)',
              border: '1px solid #281c10',
              borderRadius: 'var(--radius)',
              color: 'var(--text-muted)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            aria-label="Pause 3D viewer"
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">pause</span>
            Pause
          </button>
        )}
      </motion.div>

      {/* â”€â”€ Legend â”€â”€ */}
      <div className="flex flex-wrap gap-5 mt-3">
        {[
          { color: 'rgba(255,245,220,0.9)', label: 'LED dome â€” pulses with BPM' },
          { color: 'rgba(6,95,70,0.5)',     label: 'Board body â€” semi-transparent in X-Ray mode' },
          { color: 'var(--accent)',          label: 'Click a reference image to sync 3D orientation' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* â”€â”€ Altium Reference Gallery strip â”€â”€ */}
      <ReferenceGalleryStrip onSyncView={handleSyncView} />

      {/* â”€â”€ BLDC Motor â€” Technical Deep Dive â”€â”€ */}
      <MotorLab />

      {/* â”€â”€ UAS Aerospace â€” Water Contact Sensor â”€â”€ */}
      <WaterSenseDive />

    </section>
  )
}
