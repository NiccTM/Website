import { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Center, Text, useGLTF } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { useUI } from '../../context/UIContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const EXPLODE_SCALE  = 1.8   // how far parts spread (multiplier on centroid offset)
const LERP_SPEED     = 0.06  // per-frame lerp factor — lower = smoother

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Compute world-space centroid of all meshes in a scene */
function computeSceneCentroid(scene) {
  const box = new THREE.Box3()
  scene.traverse((obj) => {
    if (obj.isMesh) box.expandByObject(obj)
  })
  const center = new THREE.Vector3()
  box.getCenter(center)
  return center
}

/**
 * For each mesh, compute its own bounding-box center, then derive
 * an "explode direction" = unit vector from scene centroid to mesh centroid.
 * Returns Map<mesh.uuid, { origin: Vector3, dir: Vector3 }>
 */
function buildExplodeMap(scene, sceneCentroid) {
  const map = new Map()
  scene.traverse((obj) => {
    if (!obj.isMesh) return
    const meshBox = new THREE.Box3().setFromObject(obj)
    const meshCenter = new THREE.Vector3()
    meshBox.getCenter(meshCenter)

    const dir = meshCenter.clone().sub(sceneCentroid).normalize()
    // Guard: if mesh is exactly at centroid, push it up so it still animates
    if (dir.lengthSq() < 0.001) dir.set(0, 1, 0)

    map.set(obj.uuid, {
      origin: obj.position.clone(),
      dir,
    })
  })
  return map
}

// ─── Animated GLB scene ───────────────────────────────────────────────────────

function ExplodableModel({ modelPath, exploded }) {
  const { scene } = useGLTF(modelPath)

  // Deep-clone so multiple usages don't share state
  const cloned = useMemo(() => scene.clone(true), [scene])

  const explodeMapRef  = useRef(null)
  const explodeFactorRef = useRef(0)  // 0 = assembled, 1 = exploded

  // Build explode map once after clone is ready
  useEffect(() => {
    const centroid = computeSceneCentroid(cloned)
    explodeMapRef.current = buildExplodeMap(cloned, centroid)
  }, [cloned])

  // Lerp explode factor and apply per-frame
  useFrame(() => {
    const target = exploded ? 1 : 0
    explodeFactorRef.current = THREE.MathUtils.lerp(
      explodeFactorRef.current,
      target,
      LERP_SPEED
    )

    const map = explodeMapRef.current
    if (!map) return

    cloned.traverse((obj) => {
      if (!obj.isMesh) return
      const entry = map.get(obj.uuid)
      if (!entry) return

      // Move mesh along its explode direction scaled by factor
      obj.position.copy(entry.origin).addScaledVector(
        entry.dir,
        explodeFactorRef.current * EXPLODE_SCALE
      )
    })
  })

  return <primitive object={cloned} />
}

// ─── Placeholder (no model loaded) ───────────────────────────────────────────

function PlaceholderMesh({ label }) {
  return (
    <group>
      <mesh castShadow>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial color="#6ee7b7" metalness={0.6} roughness={0.3} />
      </mesh>
      <Text
        position={[0, -2.1, 0]}
        fontSize={0.2}
        color="#4b5563"
        anchorX="center"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4xD-IQ.woff"
      >
        {label ?? 'Drop a .glb into /public/models/'}
      </Text>
    </group>
  )
}

// ─── R3F scene content ────────────────────────────────────────────────────────

function SceneContent({ modelPath, label, exploded }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-4, 2, -4]} intensity={0.4} />
      <Environment preset="city" />

      <Center>
        {modelPath ? (
          <Suspense fallback={<PlaceholderMesh label="Loading model…" />}>
            <ExplodableModel modelPath={modelPath} exploded={exploded} />
          </Suspense>
        ) : (
          <PlaceholderMesh label={label} />
        )}
      </Center>

      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={14}
        autoRotate={!exploded}   // stop auto-rotate during explode so user can inspect
        autoRotateSpeed={0.5}
      />
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

/**
 * Props:
 *   modelPath — path to .glb in /public, e.g. "/models/delorean-engine.glb"
 *   label     — fallback label when no model is loaded
 *   height    — canvas height in px (default 420)
 */
export default function ModelViewer({
  modelPath,
  label = 'Custom BLDC Motor',
  height = 420,
  sectionId,
}) {
  const [exploded, setExploded] = useState(false)
  const { command } = useUI()

  // React to terminal EXPLODE commands scoped to this model's section
  useEffect(() => {
    if (!command) return
    if (command.type === 'EXPLODE') setExploded(command.payload)
  }, [command])

  return (
    <motion.section
      id={sectionId}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24"
    >
      {/* Header row */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
        <div>
          <h2
            className="font-mono-data tracking-widest uppercase"
            style={{ color: 'var(--accent)' }}
          >
            3D Model — {label}
          </h2>
          <p className="font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {/* Exploded view toggle — only meaningful when a model is loaded */}
        {modelPath && (
          <button
            onClick={() => setExploded((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border font-mono-data text-xs transition-all duration-200"
            style={{
              borderColor: exploded ? 'var(--accent)'        : 'var(--border)',
              color:       exploded ? 'var(--accent)'        : 'var(--text-muted)',
              background:  exploded ? 'rgba(6,95,70,0.15)'  : 'var(--bg-surface-2)',
            }}
            aria-pressed={exploded}
          >
            <span className="material-symbols-rounded text-sm">
              {exploded ? 'compress' : 'open_with'}
            </span>
            {exploded ? 'Assembled' : 'Exploded View'}
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        className="rounded-xl border-subtle overflow-hidden mt-4"
        style={{ height: `${height}px`, background: 'var(--bg-surface-1)' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 1.5, 5], fov: 50 }}
          shadows
        >
          <SceneContent modelPath={modelPath} label={label} exploded={exploded} />
        </Canvas>
      </div>

      {/* Explode hint */}
      {modelPath && (
        <p
          className="font-mono-data text-xs mt-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {exploded
            ? 'Engine block separated — inspect individual assemblies'
            : 'Toggle exploded view to inspect component separation'}
        </p>
      )}
    </motion.section>
  )
}
