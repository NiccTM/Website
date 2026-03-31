import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// ─── Vinyl disc geometry ──────────────────────────────────────────────────────

function VinylDisc({ coverUrl }) {
  const discRef   = useRef()
  const grooveRef = useRef()

  // Load cover image as texture — falls back to plain dark disc on error
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    if (!coverUrl) return
    const loader = new TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      coverUrl,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        setTexture(t)
      },
      undefined,
      () => setTexture(null)   // silent fallback on CORS/404
    )
    return () => {
      if (texture) texture.dispose()
    }
  }, [coverUrl])

  // Constant spin — 33⅓ RPM feels right (~2s per revolution)
  useFrame((_, delta) => {
    if (discRef.current)   discRef.current.rotation.y   += delta * 3.14
    if (grooveRef.current) grooveRef.current.rotation.y += delta * 3.14
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Main vinyl platter — flat black disc */}
      <mesh ref={discRef} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128, 1]} />
        <meshStandardMaterial color="#0d0d0d" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Label area — applies cover art texture on centre cylinder */}
      <mesh ref={grooveRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.005, 128, 1]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#1a1a2e'}
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* Spindle hole */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 32]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tonearm — static, decorative */}
      <group position={[1.7, 0.15, -0.6]} rotation={[0, -0.3, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 16]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Headshell */}
        <mesh position={[-0.68, 0, 0]}>
          <boxGeometry args={[0.12, 0.04, 0.08]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Plinth / base */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.12, 3.0]} />
        <meshStandardMaterial color="#111" metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}

// ─── Scene wrapper ────────────────────────────────────────────────────────────

function TurntableScene({ release }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} castShadow />
      <directionalLight position={[-3, 2, -3]} intensity={0.3} />
      <Environment preset="studio" />

      <Suspense fallback={null}>
        <VinylDisc coverUrl={release?.cover_image} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={7}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={false}
      />
    </>
  )
}

// ─── Modal overlay ────────────────────────────────────────────────────────────

/**
 * Props:
 *   release — { id, artist, title, year, cover_image }
 *   onClose — callback to dismiss modal
 */
export default function InteractiveTurntable({ release, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${release.artist} — ${release.title}`}
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
          className="flex items-center gap-1.5 font-mono-data text-xs transition-colors duration-150 px-3 py-2 rounded-lg border-subtle"
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
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1,    y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-2xl"
        style={{ height: '60vh', minHeight: '340px' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 3, 5], fov: 45 }}
          shadows
        >
          <TurntableScene release={release} />
        </Canvas>
      </motion.div>

      {/* Footer hint */}
      <p
        className="absolute bottom-6 font-mono-data text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Drag to orbit · Cover art applied to label
      </p>
    </motion.div>
  )
}
