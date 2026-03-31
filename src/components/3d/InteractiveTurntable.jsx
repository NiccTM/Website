import { useRef, useEffect, Suspense, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Y-Stack (all positions relative to plinth top = 0.000) ──────────────────
// Plinth top surface : Y = 0.000
// Record disc base   : Y = 0.002  (group center = 0.022)
// Record top surface : Y = 0.042
// Label face         : Y = 0.043
// Tonearm pivot      : Y = 0.043

// ─── Procedural groove normal map ─────────────────────────────────────────────
// Uses canvas arc() to draw ~200 concentric rings — sharp enough for SpotLight
// to produce V-shaped shimmer highlights as the disc rotates.
function useGrooveNormalMap(size = 1024, grooves = 200) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const cx = size / 2, cy = size / 2

    // Flat normal base — rgb(128,128,255) = pointing straight up
    ctx.fillStyle = 'rgb(128,128,255)'
    ctx.fillRect(0, 0, size, size)

    // Draw concentric arcs alternating between peak and valley normals
    // Peak  (ridge top)  → rgb(150,150,255) — tilts slightly outward
    // Valley (groove bottom) → rgb(100,100,255) — tilts slightly inward
    const step = (size / 2) / grooves
    for (let i = 0; i < grooves; i++) {
      const r = i * step
      const isPeak = i % 2 === 0
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = isPeak ? 'rgb(155,155,255)' : 'rgb(100,100,255)'
      ctx.lineWidth = step * 0.7
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
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.0} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.22} />
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

// ─── Vinyl record + label (rotates together) ──────────────────────────────────
function VinylRecord({ coverUrl }) {
  const groupRef  = useRef()
  const normalMap = useGrooveNormalMap(1024, 200)
  const proxyUrl  = proxied(coverUrl)

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 3.49
  })

  return (
    // Group center at Y=0.022 → base at 0.002, top at 0.042
    <group ref={groupRef} position={[0, 0.022, 0]}>
      <mesh name="Vinyl_Disc" castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshStandardMaterial
          color="#020202"
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>

      {/* Label — local Y=0.021 → world Y=0.043 ✓ */}
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

// ─── Plinth — top surface at Y=0.000 ─────────────────────────────────────────
function Plinth() {
  return (
    <group>
      {/* Box: height 0.12, center Y=-0.06 → top at Y=0.000 */}
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.12, 3.2]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.88} metalness={0.06} />
      </mesh>

      {/* Platter well — sits flush at plinth top */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.53, 1.53, 0.004, 128]} />
        <meshStandardMaterial color="#161616" roughness={0.8} metalness={0.12} />
      </mesh>

      {/* Tonearm bearing post */}
      <mesh position={[1.72, 0.14, -0.55]}>
        <cylinderGeometry args={[0.042, 0.042, 0.28, 16]} />
        <meshStandardMaterial color="#777" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Tonearm group — pivot at Y=0.043 (record top) */}
      <group position={[1.72, 0.043, -0.55]} rotation={[0, 0.3, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.013, 0.007, 1.5, 16]} />
          <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.77, 0, 0.02]} rotation={[0.08, 0, 0.12]}>
          <boxGeometry args={[0.12, 0.028, 0.058]} />
          <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Stylus tip at record surface — rotation angles it down */}
        <mesh position={[-0.84, -0.028, 0.02]} rotation={[0, 0, 0.28]}>
          <cylinderGeometry args={[0.003, 0.001, 0.058, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Speed LED */}
      <mesh position={[-1.5, 0.003, 1.1]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 32]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#6ee7b7" emissiveIntensity={1.0} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release }) {
  return (
    <>
      {/* Studio IBL — dialed way down so it only adds subtle reflections, not flat diffuse */}
      <Environment preset="studio" environmentIntensity={0.18} />

      {/* Very low ambient — scene should be primarily lit by spots */}
      <ambientLight intensity={0.04} />

      {/* Key directional — fills shadow side of plinth softly */}
      <directionalLight position={[4, 7, 5]} intensity={0.4} />

      {/* Primary groove spotlight — grazing angle for V-shaped shimmer on normal map */}
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

      {/* Second groove light — opposite side, warm tint */}
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

      {/* Label fill — strong overhead point, distance=2.5 keeps hotspot on label only */}
      <pointLight position={[0, 2, 0]} intensity={7} distance={2.5} decay={2} color="#ffffff" />

      {/* Accent rim */}
      <pointLight position={[-2, 1, 2]} intensity={0.4} color="#6ee7b7" decay={2} />

      <VinylRecord coverUrl={release?.cover_image} />
      <Plinth />

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
            <TurntableScene release={release} />
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
