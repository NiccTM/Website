import { useRef, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, SpotLight } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Procedural groove textures ───────────────────────────────────────────────
// Generates a radial normal map + roughness map via CanvasTexture.
// Concentric rings encode surface normals: bright ring edge = outward XZ tilt.

function useGrooveTextures(size = 1024, grooveCount = 80) {
  return useMemo(() => {
    // ── Normal map ───────────────────────────────────────────────────────────
    const normalCanvas = document.createElement('canvas')
    normalCanvas.width = normalCanvas.height = size
    const nCtx = normalCanvas.getContext('2d')
    const nImg = nCtx.createImageData(size, size)
    const cx = size / 2, cy = size / 2, maxR = size / 2

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy
        const r = Math.sqrt(dx * dx + dy * dy)
        const normR = r / maxR                        // 0..1 from centre

        // Concentric groove wave — sine wave along radial direction
        // Phase controls which groove ring we're on
        const phase = normR * grooveCount * Math.PI * 2
        const slope = Math.cos(phase)                 // -1..1, groove slope

        // Encode normal: tangent tilts in radial direction
        // Normal map convention: R=+X, G=+Y (tangent space)
        // Radial direction unit vector
        const len = Math.max(r, 0.001)
        const nx = (dx / len) * slope * 0.6           // radial X tilt
        const nz = (dy / len) * slope * 0.6           // radial Z tilt (stored in G)
        const ny = Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz))

        const i = (y * size + x) * 4
        nImg.data[i]     = Math.round((nx * 0.5 + 0.5) * 255)  // R
        nImg.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)  // G
        nImg.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)  // B
        nImg.data[i + 3] = 255
      }
    }
    nCtx.putImageData(nImg, 0, 0)
    const normalMap = new THREE.CanvasTexture(normalCanvas)
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping

    // ── Roughness map ────────────────────────────────────────────────────────
    // Groove valleys are slightly rougher (darker = smoother in R3F convention)
    const roughCanvas = document.createElement('canvas')
    roughCanvas.width = roughCanvas.height = size
    const rCtx = roughCanvas.getContext('2d')
    const rImg = rCtx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy
        const r = Math.sqrt(dx * dx + dy * dy)
        const normR = r / maxR
        const phase = normR * grooveCount * Math.PI * 2
        // Ridge tops = low roughness (shiny), valleys = higher roughness
        const val = Math.round((Math.sin(phase) * 0.5 + 0.5) * 60 + 100)
        const i = (y * size + x) * 4
        rImg.data[i] = rImg.data[i+1] = rImg.data[i+2] = val
        rImg.data[i+3] = 255
      }
    }
    rCtx.putImageData(rImg, 0, 0)
    const roughnessMap = new THREE.CanvasTexture(roughCanvas)
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping

    return { normalMap, roughnessMap }
  }, [size, grooveCount])
}

// ─── Album label ──────────────────────────────────────────────────────────────
function AlbumLabel({ coverUrl }) {
  const texture = useTexture(coverUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.48, 128]} />
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.0} />
    </mesh>
  )
}

function PlainLabel() {
  return (
    <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.48, 128]} />
      <meshStandardMaterial color="#111122" roughness={0.6} />
    </mesh>
  )
}

// ─── PBR vinyl disc ───────────────────────────────────────────────────────────
function VinylRecord({ coverUrl }) {
  const groupRef = useRef()
  const { normalMap, roughnessMap } = useGrooveTextures(1024, 90)
  const proxyUrl = proxied(coverUrl)

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 3.49
  })

  return (
    <group ref={groupRef} position={[0, 0.02, 0]}>
      {/* Grooved disc — MeshPhysicalMaterial for clearcoat sheen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshPhysicalMaterial
          color="#0d0d0d"
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.2, 1.2)}
          roughnessMap={roughnessMap}
          roughness={0.28}
          metalness={0.08}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          reflectivity={0.5}
        />
      </mesh>

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

// ─── Plinth ───────────────────────────────────────────────────────────────────
function Plinth() {
  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.12, 3.2]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Platter well */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.53, 1.53, 0.006, 128]} />
        <meshStandardMaterial color="#161616" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Tonearm post */}
      <mesh position={[1.72, 0.18, -0.55]}>
        <cylinderGeometry args={[0.042, 0.042, 0.28, 16]} />
        <meshStandardMaterial color="#777" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Tonearm — pivoted to sit stylus near inner groove */}
      <group position={[1.72, 0.28, -0.55]} rotation={[0, 0.28, -0.06]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.008, 1.6, 16]} />
          <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.82, -0.01, 0.02]} rotation={[0.1, 0, 0.18]}>
          <boxGeometry args={[0.13, 0.03, 0.062]} />
          <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Stylus angled down into groove */}
        <mesh position={[-0.9, -0.042, 0.02]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[0.004, 0.001, 0.072, 8]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Speed LED */}
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
      <ambientLight intensity={0.2} />

      {/* Key light */}
      <directionalLight position={[4, 7, 5]} intensity={1.2} castShadow
        shadow-mapSize={[1024, 1024]} />

      {/* Fill */}
      <directionalLight position={[-3, 3, -4]} intensity={0.2} />

      {/*
        Groove spotlight — low angle, high intensity.
        Critical for catching V-shape highlights in the groove normal map.
        Angle ~18° keeps the cone tight to the disc surface.
      */}
      <SpotLight
        position={[2.5, 1.8, 2.5]}
        target-position={[0, 0, 0]}
        angle={0.32}
        penumbra={0.4}
        intensity={18}
        distance={10}
        color="#ffffff"
        castShadow={false}
      />

      {/* Second groove light from opposite side for symmetry */}
      <SpotLight
        position={[-2.5, 1.6, -1.5]}
        target-position={[0, 0, 0]}
        angle={0.28}
        penumbra={0.5}
        intensity={10}
        distance={10}
        color="#ffe8c0"
        castShadow={false}
      />

      {/* Label fill — straight down, tight distance */}
      <pointLight position={[0, 2.5, 0]} intensity={2.5} distance={3.5} decay={2} color="#ffffff" />

      {/* Accent rim */}
      <pointLight position={[-2, 1, 2]} intensity={0.4} color="#6ee7b7" />

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
        className="relative w-full max-w-2xl bg-transparent"
        style={{ height: '64vh', minHeight: '380px' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 5, 4.5], fov: 40 }}
          style={{ background: 'transparent' }}
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
