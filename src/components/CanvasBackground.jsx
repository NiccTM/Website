import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 700
const SPREAD = 12

function Particles() {
  const meshRef    = useRef()
  const mouseNDC   = useRef({ x: 0, y: 0 })   // raw NDC [-1,1]
  const mouseWorld = useRef({ x: 0, y: 0 })   // converted each frame
  const { viewport, camera } = useThree()

  useEffect(() => {
    const handler = (e) => {
      mouseNDC.current.x =  (e.clientX / window.innerWidth)  * 2 - 1
      mouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const { positions, phases, driftX, driftY } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const phases    = new Float32Array(PARTICLE_COUNT)
    const driftX    = new Float32Array(PARTICLE_COUNT)
    const driftY    = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * SPREAD
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
      positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 0.3
      phases[i]  = Math.random() * Math.PI * 2
      driftX[i]  = (Math.random() - 0.5) * 0.003
      driftY[i]  = (Math.random() - 0.5) * 0.003
    }
    return { positions, phases, driftX, driftY }
  }, [])

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime()
    const pos = meshRef.current.geometry.attributes.position.array

    // Unproject NDC → world at z=0 using the actual camera+viewport
    const vec = new THREE.Vector3(mouseNDC.current.x, mouseNDC.current.y, 0.5)
    vec.unproject(camera)
    const dir = vec.sub(camera.position).normalize()
    const dist0 = -camera.position.z / dir.z   // t where ray hits z=0 plane
    mouseWorld.current.x = camera.position.x + dir.x * dist0
    mouseWorld.current.y = camera.position.y + dir.y * dist0

    const mx = mouseWorld.current.x
    const my = mouseWorld.current.y
    const RADIUS = 2.5
    const FORCE  = 0.12

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Slow individual drift
      pos[i * 3]     += Math.sin(t * 0.15 + phases[i])       * driftX[i]
      pos[i * 3 + 1] += Math.cos(t * 0.12 + phases[i] * 1.3) * driftY[i]

      // Mouse repulsion — same coordinate space, works correctly
      const dx   = pos[i * 3]     - mx
      const dy   = pos[i * 3 + 1] - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < RADIUS && dist > 0.001) {
        const strength = (1 - dist / RADIUS) ** 2
        pos[i * 3]     += (dx / dist) * FORCE * strength
        pos[i * 3 + 1] += (dy / dist) * FORCE * strength
      }

      // Soft boundary — gently pull back toward origin if drifting too far
      const boundary = SPREAD * 0.65
      if (Math.abs(pos[i * 3])     > boundary) pos[i * 3]     *= 0.997
      if (Math.abs(pos[i * 3 + 1]) > boundary) pos[i * 3 + 1] *= 0.997
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
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
        size={0.022}
        color="#A9D0F5"
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
