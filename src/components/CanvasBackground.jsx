import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 600
const SPREAD = 12

function Particles() {
  const meshRef = useRef()

  // Generate positions once — avoid per-frame allocation
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const phases = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 0.4
      phases[i] = Math.random() * Math.PI * 2
    }

    return { positions, phases }
  }, [])

  // Animate: slow drift + subtle breathing on Y
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pos = meshRef.current.geometry.attributes.position.array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.2 + phases[i]) * 0.0006
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.rotation.y = t * 0.018
    meshRef.current.rotation.x = t * 0.006
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#6ee7b7"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function CanvasBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <Canvas
        dpr={[1, 1.5]}          // cap pixel ratio — performance guard
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power',
        }}
        camera={{ position: [0, 0, 7], fov: 60 }}
        style={{ background: 'transparent' }}
        frameloop="always"
      >
        <Particles />
      </Canvas>
    </div>
  )
}
