import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture, Environment } from '@react-three/drei'
import { damp } from 'maath/easing'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useUI } from '../../context/UIContext'

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
// Stylus tip in pivot-local space: [-0.84, -0.028, 0.02].
//
// rotation.y  →  stylus radius from origin
//   0.75 rad  →  R ≈ 1.58  (parked, outside record edge 1.50)
//   0.60 rad  →  R ≈ 1.44  (outer groove)
//   0.25 rad  →  R ≈ 0.68  (inner groove, label edge)
const TONEARM_REST     = 0.75   // parked angle (rad)
const TONEARM_PLAY     = 0.60   // outer groove (rad)
const TONEARM_INNER    = 0.25   // inner groove (rad)
const RAISE_HEIGHT     = 0.14   // how far pivot lifts above Y=0.043 when cued up
const PIVOT_BASE_Y     = 0.043  // surface-level Y for pivot
const TRACKING_SECS    = 45     // seconds to sweep outer → inner groove (demo speed)

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
        roughness={0.5}
        metalness={0.0}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0.22}
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

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // rpm → rad/s: (rpm / 60) × 2π
    groupRef.current.rotation.y += delta * (rpm / 60) * Math.PI * 2
  })

  return (
    <group ref={groupRef} position={[0, 0.022, 0]}>
      <mesh name="Vinyl_Disc" castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshPhysicalMaterial
          color="#020202"
          roughness={0.12}
          metalness={0.85}
          anisotropy={1.0}
          anisotropyRotation={Math.PI / 2}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(2.0, 2.0)}
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
  const stateRef    = useRef(ARM.PARKED)
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
        // Transition once angle is settled (< 0.004 rad ≈ 0.23°)
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
    // Initial position: raised. The useFrame damp drives it from here.
    <group ref={groupRef} position={[1.72, PIVOT_BASE_Y + RAISE_HEIGHT, -0.55]} rotation={[0, TONEARM_REST, 0]}>
      {/* Arm tube */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.007, 1.5, 16]} />
        <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Cartridge body */}
      <mesh position={[-0.77, 0, 0.02]} rotation={[0.08, 0, 0.12]}>
        <boxGeometry args={[0.12, 0.028, 0.058]} />
        <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Stylus tip */}
      <mesh position={[-0.84, -0.028, 0.02]} rotation={[0, 0, 0.28]}>
        <cylinderGeometry args={[0.003, 0.001, 0.058, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// ─── Plinth ────────────────────────────────────────────────────────────────────
function Plinth({ isPlaying }) {
  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.12, 3.2]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.88} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.53, 1.53, 0.004, 128]} />
        <meshStandardMaterial color="#161616" roughness={0.8} metalness={0.12} />
      </mesh>
      {/* Bearing post */}
      <mesh position={[1.72, 0.14, -0.55]}>
        <cylinderGeometry args={[0.042, 0.042, 0.28, 16]} />
        <meshStandardMaterial color="#777" metalness={0.88} roughness={0.12} />
      </mesh>
      <Tonearm isPlaying={isPlaying} />
      {/* Speed LED */}
      <mesh position={[-1.5, 0.003, 1.1]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 32]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#6ee7b7" emissiveIntensity={1.0} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release, isPlaying }) {
  return (
    <>
      <Environment preset="studio" environmentIntensity={0.18} />
      <ambientLight intensity={0.04} />
      <directionalLight position={[4, 7, 5]} intensity={0.4} />
      <spotLight
        position={[5, 8, 5]}
        angle={0.14}
        penumbra={0.9}
        intensity={180}
        distance={22}
        decay={2}
        color="#ffffff"
        castShadow={false}
        target-position={[0, 0, 0]}
      />
      <spotLight
        position={[-4, 6, -3]}
        angle={0.18}
        penumbra={0.8}
        intensity={80}
        distance={18}
        decay={2}
        color="#ffd580"
        castShadow={false}
        target-position={[0, 0, 0]}
      />
      <pointLight position={[0, 2, 0]} intensity={7} distance={2.5} decay={2} color="#ffffff" />
      <pointLight position={[-2, 1, 2]} intensity={0.4} color="#6ee7b7" decay={2} />

      <VinylRecord coverUrl={release?.cover_image} />
      <Plinth isPlaying={isPlaying} />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function InteractiveTurntable({ release, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Arm drops 0.8 s after modal opens — deliberate mechanical cue
  useEffect(() => {
    const id = setTimeout(() => setIsPlaying(true), 800)
    return () => clearTimeout(id)
  }, [])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: 'rgba(3,7,18,0.94)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 sm:px-10">
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
          <span className="material-symbols-rounded text-sm">close</span>
          ESC
        </button>
      </div>

      <motion.div
        initial={{ scale: 0.93, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 18 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-transparent"
        style={{ height: '64vh', minHeight: '380px' }}
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 5, 4.5], fov: 40 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <TurntableScene release={release} isPlaying={isPlaying} />
          </Suspense>
        </Canvas>
      </motion.div>

      <p className="absolute bottom-6 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
        Drag to orbit · Scroll to zoom
      </p>
    </motion.div>,
    document.body
  )
}
