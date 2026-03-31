import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Album label — useTexture integrates with Suspense ────────────────────────
function AlbumLabel({ coverUrl }) {
  const texture = useTexture(coverUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5, 128]} />
      <meshStandardMaterial
        map={texture}
        // Emissive ensures art shows regardless of lighting angle
        emissiveMap={texture}
        emissiveIntensity={0.55}
        emissive="#ffffff"
        roughness={0.4}
        metalness={0.0}
      />
    </mesh>
  )
}

function PlainLabel() {
  return (
    <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5, 128]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
    </mesh>
  )
}

// ─── Spinning disc group ──────────────────────────────────────────────────────
function VinylDisc({ coverUrl }) {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 1.745
  })

  const proxyUrl = proxied(coverUrl)

  // Groove radii — using TorusGeometry so they look correct at any angle
  const grooveRadii = [0.65, 0.85, 1.05, 1.25]

  return (
    // Disc sits ON the plinth — plinth top surface is at y=0, disc center at y=0.02
    <group ref={groupRef} position={[0, 0.02, 0]}>
      {/* Main vinyl platter */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshStandardMaterial color="#090909" metalness={0.0} roughness={0.92} />
      </mesh>

      {/* Groove area — darker fill between label and edge */}
      <mesh position={[0, 0.021, 0]}>
        <cylinderGeometry args={[1.48, 0.52, 0.002, 128]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.95} />
      </mesh>

      {/* Groove rings — TorusGeometry renders correctly at all camera angles */}
      {grooveRadii.map((r) => (
        <mesh key={r} position={[0, 0.022, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.006, 6, 128]} />
          <meshStandardMaterial color="#161616" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}

      {/* Album art label */}
      {proxyUrl ? (
        <Suspense fallback={<PlainLabel />}>
          <AlbumLabel coverUrl={proxyUrl} />
        </Suspense>
      ) : (
        <PlainLabel />
      )}

      {/* Spindle */}
      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.065, 32]} />
        <meshStandardMaterial color="#333" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Plinth — disc sits at y=0 on top surface ─────────────────────────────────
function Plinth() {
  // Plinth box: height 0.12, center at y=-0.06 → top surface at y=0 ✓
  return (
    <group>
      {/* Base */}
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.12, 3.2]} />
        <meshStandardMaterial color="#0b0b0b" metalness={0.05} roughness={0.9} />
      </mesh>

      {/* Recessed platter well — slightly inset circle on top */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.53, 1.53, 0.008, 128]} />
        <meshStandardMaterial color="#141414" metalness={0.15} roughness={0.8} />
      </mesh>

      {/* Tonearm bearing post */}
      <mesh position={[1.72, 0.18, -0.55]}>
        <cylinderGeometry args={[0.042, 0.042, 0.28, 16]} />
        <meshStandardMaterial color="#666" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Tonearm tube */}
      <group position={[1.72, 0.28, -0.55]} rotation={[0, 0.28, -0.06]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.009, 1.6, 16]} />
          <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Headshell */}
        <mesh position={[-0.82, -0.01, 0.02]} rotation={[0.1, 0, 0.18]}>
          <boxGeometry args={[0.13, 0.03, 0.062]} />
          <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Stylus */}
        <mesh position={[-0.9, -0.042, 0.02]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.004, 0.001, 0.072, 8]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Speed selector LED */}
      <mesh position={[-1.5, 0.004, 1.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.018, 32]} />
        <meshStandardMaterial
          color="#6ee7b7"
          emissive="#6ee7b7"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      {/* Key light */}
      <directionalLight position={[3, 8, 4]} intensity={1.6} castShadow
        shadow-mapSize={[1024, 1024]} />
      {/* Fill */}
      <directionalLight position={[-3, 4, -4]} intensity={0.3} />
      {/* Dedicated label light — straight down so art is always bright */}
      <pointLight position={[0, 3.5, 0]} intensity={1.2} color="#ffffff" />
      {/* Accent rim */}
      <pointLight position={[-2, 1.5, 2]} intensity={0.5} color="#6ee7b7" />

      <Environment preset="studio" />

      <VinylDisc coverUrl={release?.cover_image} />
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
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
        className="w-full max-w-2xl"
        style={{ height: '64vh', minHeight: '380px' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 5, 4.5], fov: 40 }}
          shadows
        >
          <Suspense fallback={null}>
            <TurntableScene release={release} />
          </Suspense>
        </Canvas>
      </motion.div>

      <p className="absolute bottom-6 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
        Drag to orbit · Scroll to zoom
      </p>
    </motion.div>
  )
}
