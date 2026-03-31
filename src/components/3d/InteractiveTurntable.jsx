import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// ─── Proxied texture URL — bypasses Discogs CDN CORS ─────────────────────────
function proxiedUrl(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Vinyl disc ───────────────────────────────────────────────────────────────

function VinylDisc({ coverUrl }) {
  const groupRef = useRef()
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    const src = proxiedUrl(coverUrl)
    if (!src) return

    const loader = new TextureLoader()
    loader.load(
      src,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        // Square crop — center-fit onto the circular label
        t.center.set(0.5, 0.5)
        t.repeat.set(1, 1)
        setTexture(t)
      },
      undefined,
      (err) => console.warn('Texture load failed:', err)
    )

    return () => { texture?.dispose() }
  }, [coverUrl])

  // Spin around Y axis — disc lies flat in XZ plane
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 1.745  // ~33⅓ RPM
  })

  return (
    // Entire disc group rotates — camera looks down from above
    <group ref={groupRef}>
      {/* Vinyl platter — flat black disc, grooves via roughness */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.045, 128, 1]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.15}
          roughness={0.85}
        />
      </mesh>

      {/* Groove ring — subtle dark ring between label and outer edge */}
      <mesh position={[0, 0.023, 0]}>
        <cylinderGeometry args={[1.49, 0.54, 0.002, 128, 1]} />
        <meshStandardMaterial color="#111" metalness={0.05} roughness={0.95} />
      </mesh>

      {/* Label — cover art texture */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.006, 128, 1]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#1a1a2e'}
          metalness={0.05}
          roughness={0.5}
        />
      </mesh>

      {/* Spindle */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.07, 32]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// ─── Static plinth + tonearm ─────────────────────────────────────────────────

function Plinth() {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.1, 3.2]} />
        <meshStandardMaterial color="#0e0e0e" metalness={0.2} roughness={0.85} />
      </mesh>

      {/* Tonearm pivot post */}
      <mesh position={[1.75, 0.18, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.28, 16]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tonearm tube */}
      <group position={[1.75, 0.22, -0.5]} rotation={[0, 0.35, -0.08]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.012, 1.55, 16]} />
          <meshStandardMaterial color="#888" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Headshell */}
        <mesh position={[-0.76, 0, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.14, 0.035, 0.07]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Stylus */}
        <mesh position={[-0.83, -0.04, 0]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.006, 0.002, 0.08, 8]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function TurntableScene({ release }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={0.25} />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#6ee7b7" />
      <Environment preset="studio" />

      <Suspense fallback={null}>
        <VinylDisc coverUrl={release?.cover_image} />
      </Suspense>
      <Plinth />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 8}   // can't go below the platter
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={false}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ─── Modal overlay ────────────────────────────────────────────────────────────

export default function InteractiveTurntable({ release, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(3,7,18,0.93)', backdropFilter: 'blur(14px)' }}
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
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1,    y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="w-full max-w-2xl"
        style={{ height: '62vh', minHeight: '360px' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 4.5, 4], fov: 42 }}
          shadows
        >
          <TurntableScene release={release} />
        </Canvas>
      </motion.div>

      <p className="absolute bottom-6 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
        Drag to orbit · cover art on label
      </p>
    </motion.div>
  )
}
