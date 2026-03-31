import { useRef, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Coordinate system ────────────────────────────────────────────────────────
// Plinth top surface  = Y  0.000
// Record base         = Y  0.001  (clears Z-fighting)
// Record top          = Y  0.041  (0.001 + 0.04 thickness)
// Label face          = Y  0.043  (just above record top)
// Spindle base        = Y  0.001
// Tonearm pivot       = Y  0.041  (stylus sits on record surface)

// ─── Procedural groove textures ───────────────────────────────────────────────
function useGrooveTextures(size = 1024, grooveCount = 90) {
  return useMemo(() => {
    const cx = size / 2, cy = size / 2, maxR = size / 2

    // Normal map — radial sine wave encoded as tangent-space normals
    const nCanvas = document.createElement('canvas')
    nCanvas.width = nCanvas.height = size
    const nCtx = nCanvas.getContext('2d')
    const nImg = nCtx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy
        const r = Math.sqrt(dx * dx + dy * dy)
        const normR = r / maxR
        const phase = normR * grooveCount * Math.PI * 2
        const slope = Math.cos(phase)
        const len = Math.max(r, 0.001)
        const nx = (dx / len) * slope * 0.55
        const nz = (dy / len) * slope * 0.55
        const ny = Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz))
        const i = (y * size + x) * 4
        nImg.data[i]     = Math.round((nx * 0.5 + 0.5) * 255)
        nImg.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
        nImg.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
        nImg.data[i + 3] = 255
      }
    }
    nCtx.putImageData(nImg, 0, 0)
    const normalMap = new THREE.CanvasTexture(nCanvas)

    // Roughness map — ridge tops smooth, valleys rough
    const rCanvas = document.createElement('canvas')
    rCanvas.width = rCanvas.height = size
    const rCtx = rCanvas.getContext('2d')
    const rImg = rCtx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy
        const r = Math.sqrt(dx * dx + dy * dy)
        const normR = r / maxR
        const phase = normR * grooveCount * Math.PI * 2
        const val = Math.round((Math.sin(phase) * 0.5 + 0.5) * 55 + 100)
        const i = (y * size + x) * 4
        rImg.data[i] = rImg.data[i+1] = rImg.data[i+2] = val
        rImg.data[i+3] = 255
      }
    }
    rCtx.putImageData(rImg, 0, 0)
    const roughnessMap = new THREE.CanvasTexture(rCanvas)

    return { normalMap, roughnessMap }
  }, [size, grooveCount])
}

// ─── Album label ──────────────────────────────────────────────────────────────
function AlbumLabel({ coverUrl }) {
  const texture = useTexture(coverUrl)
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh position={[0, 0.043, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.48, 128]} />
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.0} />
    </mesh>
  )
}

function PlainLabel() {
  return (
    <mesh position={[0, 0.043, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.48, 128]} />
      <meshStandardMaterial color="#111122" roughness={0.6} />
    </mesh>
  )
}

// ─── Rotating record group ────────────────────────────────────────────────────
function VinylRecord({ coverUrl }) {
  const groupRef = useRef()
  const { normalMap, roughnessMap } = useGrooveTextures()
  const proxyUrl = proxied(coverUrl)

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 3.49
  })

  return (
    // Record base sits at Y=0.001, center of 0.04-thick disc at Y=0.021
    <group ref={groupRef} position={[0, 0.021, 0]}>
      <mesh name="Record_Disc" castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 128]} />
        <meshPhysicalMaterial
          color="#090909"
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.2, 1.2)}
          roughnessMap={roughnessMap}
          roughness={0.4}
          metalness={0.2}
          clearcoat={0.55}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Spindle */}
      <mesh position={[0, 0.033, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.065, 32]} />
        <meshStandardMaterial color="#333" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Label rendered at Y=0.043 in world space (group center at 0.021, local offset 0.022) */}
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

// ─── Plinth — top surface exactly at Y=0 ─────────────────────────────────────
function Plinth() {
  // Plinth box height 0.12, center at Y=-0.06 → top at Y=0.000 ✓
  return (
    <group>
      <mesh name="Plinth_Base" position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.12, 3.2]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Platter well ring — flush with plinth top */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.53, 1.53, 0.004, 128]} />
        <meshStandardMaterial color="#161616" roughness={0.8} metalness={0.12} />
      </mesh>

      {/*
        Tonearm pivot at X=1.72, Z=-0.55
        Y=0.041 so stylus tip is level with record top surface
      */}
      <mesh position={[1.72, 0.12, -0.55]}>
        <cylinderGeometry args={[0.042, 0.042, 0.24, 16]} />
        <meshStandardMaterial color="#777" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Tonearm — pivot origin at record surface height (Y=0.041) */}
      <group position={[1.72, 0.041, -0.55]} rotation={[0, 0.28, 0]}>
        {/* Arm tube — rotated on Z to slope slightly downward toward stylus */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.008, 1.55, 16]} />
          <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Headshell */}
        <mesh position={[-0.8, 0, 0.02]} rotation={[0.08, 0, 0.15]}>
          <boxGeometry args={[0.13, 0.03, 0.062]} />
          <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Stylus — tip at Y=0.041 world, pointing straight down */}
        <mesh position={[-0.87, -0.032, 0.02]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.004, 0.001, 0.065, 8]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Speed LED */}
      <mesh position={[-1.5, 0.003, 1.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.014, 32]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#6ee7b7" emissiveIntensity={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── Scene — no Drei SpotLight (removes visible cone mesh) ───────────────────
function TurntableScene({ release }) {
  // Spotlight targets need a ref'd object at world origin
  const target = useMemo(() => {
    const obj = new THREE.Object3D()
    obj.position.set(0, 0, 0)
    return obj
  }, [])

  return (
    <>
      <primitive object={target} />

      {/* Ambient */}
      <ambientLight intensity={0.18} />

      {/* Key — general scene fill */}
      <directionalLight position={[4, 7, 5]} intensity={1.1} castShadow
        shadow-mapSize={[1024, 1024]} />

      {/* Fill */}
      <directionalLight position={[-3, 3, -4]} intensity={0.18} />

      {/*
        Groove spotlights — plain R3F spotLight primitives (no visible mesh).
        Low angle (position Y≈1.8) maximises grazing incidence on groove normals.
      */}
      <spotLight
        position={[2.8, 1.8, 2.2]}
        target={target}
        angle={0.3}
        penumbra={0.35}
        intensity={22}
        distance={12}
        color="#ffffff"
        castShadow={false}
      />
      <spotLight
        position={[-2.6, 1.6, -1.8]}
        target={target}
        angle={0.26}
        penumbra={0.45}
        intensity={12}
        distance={12}
        color="#ffe0a0"
        castShadow={false}
      />

      {/* Label top light — tight point directly above */}
      <pointLight position={[0, 2.4, 0]} intensity={2.2} distance={3.2} decay={2} color="#ffffff" />

      {/* Accent */}
      <pointLight position={[-2, 1, 2]} intensity={0.35} color="#6ee7b7" />

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
