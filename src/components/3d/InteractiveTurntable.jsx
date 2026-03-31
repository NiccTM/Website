import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Album label ──────────────────────────────────────────────────────────────
function AlbumLabel({ coverUrl }) {
  const texture = useTexture(coverUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.48, 128]} />
      {/* No emissive — a dedicated rect-area/point light above handles brightness */}
      <meshStandardMaterial
        map={texture}
        roughness={0.5}
        metalness={0.0}
      />
    </mesh>
  )
}

function PlainLabel() {
  return (
    <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.48, 128]} />
      <meshStandardMaterial color="#111122" roughness={0.6} />
    </mesh>
  )
}

// ─── Spinning disc ────────────────────────────────────────────────────────────
function VinylDisc({ coverUrl }) {
  const groupRef = useRef()

  // 33⅓ RPM = 3.49 rad/s — keep it readable, not frantic
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 3.49
  })

  const proxyUrl = proxied(coverUrl)

  return (
    <group ref={groupRef} position={[0, 0.02, 0]}>
      {/* Vinyl platter */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshStandardMaterial color="#090909" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Groove fill — slightly lighter disc between label and edge */}
      <mesh position={[0, 0.021, 0]}>
        <cylinderGeometry args={[1.48, 0.51, 0.002, 128]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.95} />
      </mesh>

      {/* Groove rings — thin torus, tube radius 0.003 keeps them subtle */}
      {[0.65, 0.82, 1.0, 1.18, 1.35].map((r) => (
        <mesh key={r} position={[0, 0.022, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.003, 4, 128]} />
          <meshStandardMaterial color="#1a1a1a" roughness={1.0} metalness={0.0} />
        </mesh>
      ))}

      {/* Label */}
      {proxyUrl ? (
        <Suspense fallback={<PlainLabel />}>
          <AlbumLabel coverUrl={proxyUrl} />
        </Suspense>
      ) : (
        <PlainLabel />
      )}

      {/* Spindle */}
      <mesh position={[0, 0.053, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.065, 32]} />
        <meshStandardMaterial color="#333" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Static plinth ────────────────────────────────────────────────────────────
function Plinth() {
  return (
    <group>
      {/* Base — top surface at y=0 */}
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.12, 3.2]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Platter well ring */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.53, 1.53, 0.006, 128]} />
        <meshStandardMaterial color="#161616" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Tonearm post */}
      <mesh position={[1.72, 0.18, -0.55]}>
        <cylinderGeometry args={[0.042, 0.042, 0.28, 16]} />
        <meshStandardMaterial color="#777" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Tonearm */}
      <group position={[1.72, 0.28, -0.55]} rotation={[0, 0.28, -0.06]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.008, 1.6, 16]} />
          <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.82, -0.01, 0.02]} rotation={[0.1, 0, 0.18]}>
          <boxGeometry args={[0.13, 0.03, 0.062]} />
          <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[-0.9, -0.042, 0.02]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.004, 0.001, 0.072, 8]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Speed selector LED */}
      <mesh position={[-1.5, 0.004, 1.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.016, 32]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#6ee7b7" emissiveIntensity={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release }) {
  return (
    <>
      {/* Ambient — low, keeps scene dark */}
      <ambientLight intensity={0.25} />

      {/* Key light — angled for plinth shadow */}
      <directionalLight position={[4, 7, 5]} intensity={1.4} castShadow
        shadow-mapSize={[1024, 1024]} />

      {/* Fill — opposite side */}
      <directionalLight position={[-3, 3, -4]} intensity={0.25} />

      {/*
        Label light — small point directly above centre, no emissive needed.
        Low decay so it illuminates the 0.48r circle cleanly.
      */}
      <pointLight position={[0, 2.5, 0]} intensity={3.0} distance={4} decay={2} color="#ffffff" />

      {/* Accent rim */}
      <pointLight position={[-2, 1, 2]} intensity={0.4} color="#6ee7b7" />

      {/* Subtle environment — no preset so it doesn't interfere with label */}
      <color attach="background" args={['#00000000']} />

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
