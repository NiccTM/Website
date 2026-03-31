import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center, Text, useGLTF } from '@react-three/drei'
import { motion } from 'framer-motion'

/**
 * Props:
 *   modelPath  — path to .glb/.gltf file in /public
 *   label      — display label
 *   envPreset  — @react-three/drei environment preset (default: 'city')
 */

function ModelMesh({ modelPath }) {
  const { scene } = useGLTF(modelPath)
  return <primitive object={scene} />
}

function PlaceholderMesh({ label }) {
  return (
    <group>
      {/* Stand-in geometry until a real .glb is provided */}
      <mesh castShadow>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial
          color="#6ee7b7"
          metalness={0.6}
          roughness={0.3}
          wireframe={false}
        />
      </mesh>
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.22}
        color="#4b5563"
        anchorX="center"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4xD-IQ.woff"
      >
        {label ?? 'No model loaded'}
      </Text>
    </group>
  )
}

function SceneContent({ modelPath, label }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <Environment preset="city" />
      <Center>
        {modelPath ? (
          <Suspense fallback={<PlaceholderMesh label="Loading…" />}>
            <ModelMesh modelPath={modelPath} />
          </Suspense>
        ) : (
          <PlaceholderMesh label={label} />
        )}
      </Center>
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  )
}

export default function ModelViewer({ modelPath, label = 'Custom BLDC Motor' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24"
    >
      <h2
        className="font-mono-data tracking-widest uppercase mb-2"
        style={{ color: 'var(--accent)' }}
      >
        3D Model — {label}
      </h2>
      <p className="font-mono-data mb-5" style={{ color: 'var(--text-muted)' }}>
        Drag to rotate · Scroll to zoom
      </p>

      <div
        className="rounded-xl border-subtle overflow-hidden"
        style={{ height: '420px', background: 'var(--bg-surface-1)' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 1, 5], fov: 50 }}
          shadows
        >
          <SceneContent modelPath={modelPath} label={label} />
        </Canvas>
      </div>
    </motion.section>
  )
}
