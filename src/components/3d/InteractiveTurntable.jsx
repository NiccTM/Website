import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// ─── Proxy URL — bypasses Discogs CDN CORS for TextureLoader ─────────────────
function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Label with album art ─────────────────────────────────────────────────────
// Separate component so Suspense can catch the useTexture load
function AlbumLabel({ coverUrl }) {
  // useTexture integrates with R3F Suspense — no manual state needed
  const texture = useTexture(coverUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    // CircleGeometry has perfect radial UVs — image maps cleanly onto the disc
    <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5, 128]} />
      <meshStandardMaterial
        map={texture}
        metalness={0.05}
        roughness={0.55}
      />
    </mesh>
  )
}

// Plain label fallback when no texture / during load
function PlainLabel() {
  return (
    <mesh position={[0, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5, 128]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
    </mesh>
  )
}

// ─── Vinyl disc + spinning group ──────────────────────────────────────────────
function VinylDisc({ coverUrl }) {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 1.745
  })

  const proxyUrl = proxied(coverUrl)

  return (
    <group ref={groupRef}>
      {/* Main platter — near-black vinyl */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshStandardMaterial color="#080808" metalness={0.0} roughness={0.9} />
      </mesh>

      {/* Groove area — slightly lighter ring, creates depth illusion */}
      <mesh position={[0, 0.021, 0]}>
        <cylinderGeometry args={[1.48, 0.54, 0.002, 128]} />
        <meshStandardMaterial color="#131313" metalness={0.0} roughness={0.95} />
      </mesh>

      {/* Groove rings — 4 subtle rings for detail */}
      {[0.7, 0.9, 1.1, 1.3].map((r) => (
        <mesh key={r} position={[0, 0.022, 0]}>
          <ringGeometry args={[r, r + 0.012, 128]} />
          <meshStandardMaterial
            color="#0f0f0f"
            side={THREE.DoubleSide}
            roughness={1.0}
            metalness={0.0}
          />
        </mesh>
      ))}

      {/* Label — cover art via Suspense/useTexture */}
      {proxyUrl ? (
        <Suspense fallback={<PlainLabel />}>
          <AlbumLabel coverUrl={proxyUrl} />
        </Suspense>
      ) : (
        <PlainLabel />
      )}

      {/* Spindle */}
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.07, 32]} />
        <meshStandardMaterial color="#444" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  )
}

// ─── Plinth ───────────────────────────────────────────────────────────────────
function Plinth() {
  return (
    <group>
      {/* Base — dark walnut-like */}
      <mesh position={[0, -0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.1, 3.2]} />
        <meshStandardMaterial color="#0c0c0c" metalness={0.05} roughness={0.9} />
      </mesh>

      {/* Platter bearing ring */}
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[1.52, 1.52, 0.01, 128]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Tonearm bearing post */}
      <mesh position={[1.72, 0.2, -0.55]}>
        <cylinderGeometry args={[0.045, 0.045, 0.3, 16]} />
        <meshStandardMaterial color="#777" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Tonearm — angled toward center groove */}
      <group position={[1.72, 0.28, -0.55]} rotation={[0, 0.28, -0.06]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.01, 1.6, 16]} />
          <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Headshell */}
        <mesh position={[-0.82, -0.01, 0.02]} rotation={[0.1, 0, 0.18]}>
          <boxGeometry args={[0.13, 0.032, 0.065]} />
          <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Stylus cantilever */}
        <mesh position={[-0.9, -0.044, 0.02]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.005, 0.001, 0.075, 8]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* 33/45 speed selector button — detail */}
      <mesh position={[-1.5, 0.005, 1.1]}>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 32]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#6ee7b7" emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 8, 4]} intensity={1.8} castShadow
        shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 4, -4]} intensity={0.3} />
      {/* Accent rim light — green tint matches site palette */}
      <pointLight position={[-2, 2, 2]} intensity={0.6} color="#6ee7b7" />
      {/* Under-glow */}
      <pointLight position={[0, -1, 0]} intensity={0.15} color="#6ee7b7" />
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
      {/* Header */}
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

      {/* Canvas */}
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
