import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center } from '@react-three/drei'
import { XR, createXRStore } from '@react-three/xr'
import { motion } from 'framer-motion'

/**
 * XRCanvas — wraps an R3F scene with WebXR immersive-vr support.
 * Renders a VR-entry button when the browser supports WebXR.
 *
 * Props:
 *   children — R3F scene content (mesh, lights, etc.)
 *   label    — section label
 */

const xrStore = createXRStore()

function DefaultScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <Environment preset="sunset" />
      <Center>
        <mesh castShadow>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color="#6ee7b7"
            metalness={0.5}
            roughness={0.4}
            wireframe
          />
        </mesh>
      </Center>
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

export default function XRCanvas({ children, label = 'VR Inspection Mode' }) {
  const enterVR = () => xrStore.enterVR()

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="relative z-10 px-6 py-10 sm:px-10 md:px-16 lg:px-24"
    >
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2
            className="font-mono-data tracking-widest uppercase mb-1"
            style={{ color: 'var(--accent)' }}
          >
            {label}
          </h2>
          <p className="font-mono-data" style={{ color: 'var(--text-muted)' }}>
            WebXR — requires compatible headset (Quest Pro / Rift S)
          </p>
        </div>

        <button
          onClick={enterVR}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-accent font-mono-data transition-colors duration-200 hover:bg-accent/10"
          style={{ color: 'var(--accent)' }}
        >
          <span aria-hidden="true" className="material-symbols-rounded text-base">view_in_ar</span>
          Enter VR
        </button>
      </div>

      <div
        className="rounded-xl border-subtle overflow-hidden"
        style={{ height: '360px', background: 'var(--bg-surface-1)' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 1.5, 4], fov: 70 }}
        >
          <XR store={xrStore}>
            <Suspense fallback={null}>
              {children ?? <DefaultScene />}
            </Suspense>
          </XR>
        </Canvas>
      </div>
    </motion.section>
  )
}
