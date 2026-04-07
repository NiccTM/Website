import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture, Environment } from '@react-three/drei'
import { damp } from 'maath/easing'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useUI } from '../../context/UIContext'
import ErrorBoundary from '../ui/ErrorBoundary'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Y-Stack ──────────────────────────────────────────────────────────────────
// Plinth top surface : Y = 0.000
// Record disc base   : Y = 0.002  (group center Y = 0.022)
// Record top surface : Y = 0.042
// Label / tonearm    : Y = 0.043

// ─── Tonearm geometry constants ───────────────────────────────────────────────
// Pivot at world (1.72, 0.043, -0.55).
// Stylus tip in pivot-local space: approx [-1.368, ...] (new longer arm).
//
// rotation.y  →  stylus lands on record (recalculated for stylus at local [-1.368, _, 0.018])
//   1.25 rad  →  parked (Râ‰ˆ1.51, just outside record edge)
//   1.18 rad  →  outer groove (Râ‰ˆ1.41, near vinyl edge)
//   0.50 rad  →  inner groove (Râ‰ˆ0.54, near label)
const TONEARM_REST     = 1.25   // parked angle (rad) — just off the record edge
const TONEARM_PLAY     = 1.22   // outer groove — drops here first
const TONEARM_INNER    = 0.62   // inner groove — Râ‰ˆ0.67, stops just outside label edge (R=0.60)
const RAISE_HEIGHT     = 0.14   // how far pivot lifts when cued up
const PIVOT_BASE_Y     = 0.110  // pivot Y when playing: stylus tip (local -0.068) lands at vinyl surface Y=0.042
const TRACKING_SECS    = 120    // seconds to sweep outer → inner (slow, realistic)

// Arm state machine
const ARM = { PARKED: 0, SWINGING: 1, DROPPING: 2, PLAYING: 3 }

// ─── Procedural groove normal map ─────────────────────────────────────────────
function useGrooveNormalMap(size = 1024, grooves = 200) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const cx = size / 2, cy = size / 2

    ctx.fillStyle = 'rgb(128,128,255)'
    ctx.fillRect(0, 0, size, size)

    const step = (size / 2) / grooves
    for (let i = 0; i < grooves; i++) {
      const r = i * step
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = i % 2 === 0 ? 'rgb(158,158,255)' : 'rgb(98,98,255)'
      ctx.lineWidth = step * 0.75
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
  }, [size, grooves])
}

// ─── Album label ──────────────────────────────────────────────────────────────
function AlbumLabel({ coverUrl }) {
  const texture = useTexture(coverUrl)
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.6, 128]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.92}
        metalness={0.0}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

function PlainLabel() {
  return (
    <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.6, 128]} />
      <meshStandardMaterial color="#0d0d1a" roughness={0.6} />
    </mesh>
  )
}

// ─── Vinyl disc — anisotropic PBR, RPM-linked rotation ───────────────────────
function VinylRecord({ coverUrl }) {
  const groupRef  = useRef()
  const normalMap = useGrooveNormalMap(1024, 200)
  const proxyUrl  = proxied(coverUrl)
  const { gl }    = useThree()
  const { rpm }   = useUI()

  useEffect(() => {
    normalMap.anisotropy = gl.capabilities.getMaxAnisotropy()
    normalMap.needsUpdate = true
  }, [normalMap, gl])

  // Dispose the procedural CanvasTexture when the component unmounts
  useEffect(() => {
    return () => { normalMap.dispose() }
  }, [normalMap])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // rpm → rad/s: (rpm / 60) Ã— 2Ï€
    groupRef.current.rotation.y += delta * (rpm / 60) * Math.PI * 2
  })

  return (
    <group ref={groupRef} position={[0, 0.022, 0]}>
      <mesh name="Vinyl_Disc" castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshPhysicalMaterial
          color="#010101"
          roughness={0.06}
          metalness={0.92}
          anisotropy={1.0}
          anisotropyRotation={Math.PI / 2}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(2.8, 2.8)}
          clearcoat={0.6}
          clearcoatRoughness={0.04}
          reflectivity={1.0}
        />
      </mesh>

      {proxyUrl ? (
        <Suspense fallback={<PlainLabel />}>
          <AlbumLabel coverUrl={proxyUrl} />
        </Suspense>
      ) : (
        <PlainLabel />
      )}
    </group>
  )
}

// ─── Tonearm — arc pivot + needle drop state machine ─────────────────────────
//
// States:
//   PARKED   — arm at REST angle, pivot raised RAISE_HEIGHT above surface
//   SWINGING — arm rotating toward play angle, still raised
//   DROPPING — arm reached angle, pivot damping down to surface
//   PLAYING  — pivot at surface, tracking inward over TRACKING_SECS
//
// maath/easing `damp(obj, key, target, smoothTime, delta)` produces a
// critically-damped spring — organic deceleration with no overshoot.
function Tonearm({ isPlaying }) {
  const groupRef    = useRef()
  const stateRef    = useRef(ARM.DROPPING)  // skip swing, drop straight down at outer groove
  const progressRef = useRef(0)   // 0 = outer groove, 1 = inner groove

  // Transition PARKED → SWINGING when isPlaying fires
  useEffect(() => {
    if (isPlaying && stateRef.current === ARM.PARKED) {
      stateRef.current = ARM.SWINGING
    }
    if (!isPlaying) {
      stateRef.current = ARM.PARKED
      progressRef.current = 0
    }
  }, [isPlaying])

  useFrame((_, delta) => {
    const arm = groupRef.current
    if (!arm) return

    // Current groove angle from playback progress
    const targetAngle = TONEARM_PLAY + (TONEARM_INNER - TONEARM_PLAY) * progressRef.current

    switch (stateRef.current) {
      case ARM.PARKED:
        // Return to rest — fast enough to feel snappy, not instant
        damp(arm.rotation, 'y', TONEARM_REST, 0.35, delta)
        damp(arm.position, 'y', PIVOT_BASE_Y + RAISE_HEIGHT, 0.25, delta)
        break

      case ARM.SWINGING:
        // Swing slowly, stay raised — smoothTime=0.9 gives deliberate mechanical feel
        arm.position.y = PIVOT_BASE_Y + RAISE_HEIGHT
        damp(arm.rotation, 'y', targetAngle, 0.9, delta)
        // Transition once angle is settled (< 0.004 rad â‰ˆ 0.23Â°)
        if (Math.abs(arm.rotation.y - targetAngle) < 0.004) {
          stateRef.current = ARM.DROPPING
        }
        break

      case ARM.DROPPING:
        // Hold angle precisely, drop pivot to surface
        arm.rotation.y = targetAngle
        damp(arm.position, 'y', PIVOT_BASE_Y, 0.4, delta)
        // Transition once close enough to surface
        if (Math.abs(arm.position.y - PIVOT_BASE_Y) < 0.0008) {
          arm.position.y = PIVOT_BASE_Y
          stateRef.current = ARM.PLAYING
        }
        break

      case ARM.PLAYING:
        // Track inward — update progress, damp rotation to follow
        progressRef.current = Math.min(1, progressRef.current + delta / TRACKING_SECS)
        damp(arm.rotation, 'y', targetAngle, 0.08, delta)
        arm.position.y = PIVOT_BASE_Y
        break
    }
  })

  return (
    <group ref={groupRef} position={[1.72, PIVOT_BASE_Y + RAISE_HEIGHT, -0.55]} rotation={[0, TONEARM_PLAY, 0]}>

      {/* ── Bearing housing (pivot cup) — Rega matte black ── */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.06, 24]} />
        <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* ── Main arm tube — Rega straight matte black tube ── */}
      <mesh position={[-0.62, 0.005, 0]} rotation={[0, 0, Math.PI / 2 - 0.04]}>
        <cylinderGeometry args={[0.010, 0.014, 1.24, 20]} />
        <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.32} />
      </mesh>

      {/* ── Rear stub (counterweight arm) ── */}
      <mesh position={[0.28, 0.003, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.011, 0.013, 0.46, 16]} />
        <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* ── Counterweight — Rega grey/silver cylinder ── */}
      <mesh position={[0.54, 0, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.072, 28]} />
        <meshStandardMaterial color="#666666" metalness={0.85} roughness={0.18} />
      </mesh>
      {/* Counterweight threading ring */}
      <mesh position={[0.54, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.014, 28]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── Headshell offset group — ~22Â° Y rotation so cartridge runs tangent to groove ── */}
      <group position={[-1.20, 0, 0]} rotation={[0, -0.38, 0]}>

        {/* Headshell connector — matte black */}
        <mesh position={[-0.04, -0.012, 0]} rotation={[0.10, 0, -0.10]}>
          <boxGeometry args={[0.115, 0.018, 0.038]} />
          <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.35} />
        </mesh>

        {/* Cartridge body — dark, slight gloss */}
        <mesh position={[-0.11, -0.026, 0]} rotation={[0.10, 0, 0]}>
          <boxGeometry args={[0.095, 0.030, 0.052]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.45} />
        </mesh>

        {/* Cantilever */}
        <mesh position={[-0.16, -0.048, 0]} rotation={[0.5, 0, 0.05]}>
          <cylinderGeometry args={[0.0018, 0.0012, 0.055, 6]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Stylus tip */}
        <mesh position={[-0.168, -0.068, 0]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
        </mesh>

      </group>

    </group>
  )
}

// ─── Plinth ────────────────────────────────────────────────────────────────────
function Plinth({ isPlaying }) {
  return (
    <group>
      {/* Plinth body — Rega P2 piano-black acrylic, more square/thick */}
      <mesh position={[0, -0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.16, 3.7]} />
        <meshPhysicalMaterial color="#070707" roughness={0.04} metalness={0.0} reflectivity={1.0} clearcoat={1.0} clearcoatRoughness={0.04} />
      </mesh>

      {/* Glass platter — Rega's distinctive teal-tinted glass */}
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[1.52, 1.52, 0.024, 128]} />
        <meshPhysicalMaterial
          color="#4db8a8"
          transmission={0.55}
          roughness={0.02}
          metalness={0.0}
          ior={1.5}
          thickness={0.02}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Felt mat — Rega dark charcoal felt, sits on glass platter */}
      <mesh position={[0, 0.027, 0]}>
        <cylinderGeometry args={[1.49, 1.49, 0.008, 128]} />
        <meshStandardMaterial color="#181818" roughness={0.97} metalness={0.0} />
      </mesh>

      {/* Spindle — small pin through felt */}
      <mesh position={[0, 0.058, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.055, 16]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Tonearm bearing post — Rega style: matte black, tall pillar */}
      <mesh position={[1.72, 0.17, -0.55]}>
        <cylinderGeometry args={[0.048, 0.048, 0.34, 20]} />
        <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.3} />
      </mesh>

      <Tonearm isPlaying={isPlaying} />
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release, isPlaying }) {
  return (
    <>
      <Environment preset="apartment" environmentIntensity={0.45} />
      <ambientLight intensity={0.18} />

      {/* Key light — top-right, soft diffuse */}
      <spotLight
        position={[4, 8, 3]}
        angle={0.28}
        penumbra={0.85}
        intensity={75}
        distance={22}
        decay={2}
        color="#ffffff"
        castShadow={false}
        target-position={[0, 0, 0]}
      />

      {/* Fill — warm, low angle, catches groove rings */}
      <spotLight
        position={[-5, 4, 4]}
        angle={0.32}
        penumbra={1.0}
        intensity={38}
        distance={18}
        decay={2}
        color="#fff4e0"
        castShadow={false}
        target-position={[0, 0, 0]}
      />

      {/* Rim light — back left, subtle edge on plinth + arm */}
      <spotLight
        position={[-3, 5, -5]}
        angle={0.22}
        penumbra={1.0}
        intensity={42}
        distance={18}
        decay={2}
        color="#dde8ff"
        castShadow={false}
        target-position={[0, 0, 0]}
      />

      {/* Center point — gentle top-down on label */}
      <pointLight position={[0, 2.5, 0]} intensity={4} distance={3.5} decay={2} color="#ffffff" />
      <pointLight position={[-2, 1, 2]} intensity={0.3} color="#6ee7b7" decay={2} />

      <VinylRecord coverUrl={release?.cover_image} />
      <Plinth isPlaying={isPlaying} />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
        touches={{ ONE: 0 /* ROTATE */, TWO: 2 /* DOLLY_PAN */ }}
        enableDamping
        dampingFactor={0.07}
      />
    </>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function InteractiveTurntable({ release, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(3,7,18,0.94)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      role="dialog"
      aria-modal="true"
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 py-4 sm:px-10 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {release.title}
          </p>
          <p className="font-mono-data text-xs" style={{ color: 'var(--accent)' }}>
            {release.artist}{release.year ? ` · ${release.year}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex items-center gap-1.5 font-mono-data text-xs px-3 py-2 rounded-lg border-subtle transition-colors duration-150"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-sm">close</span>
          ESC
        </button>
      </div>

      {/* ── Canvas — fills all remaining space ── */}
      <div className="relative flex-1 min-h-0 w-full">
        <ErrorBoundary fallback={
          <img
            src="/RegaP2_VINYL.jpg"
            alt="Rega P2 turntable"
            className="w-full h-full object-cover"
            style={{ opacity: 0.7 }}
          />
        }>
          <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 5, 4.5], fov: 40 }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <Suspense fallback={null}>
              <TurntableScene release={release} isPlaying={isPlaying} />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* ── Footer hint ── */}
      <div className="shrink-0 py-3 text-center">
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
          Drag to orbit · Scroll to zoom
        </p>
      </div>
    </motion.div>,
    document.body
  )
}
