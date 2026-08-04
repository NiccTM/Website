import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds, useBounds } from '@react-three/drei'
// EffectComposer/Bloom removed -- @react-three/postprocessing has version conflicts that crash the Canvas
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'

/*
 * Everything that touches three.js lives in this file, and nothing else
 * imports it statically.
 *
 * WHY IT IS A SEPARATE MODULE
 * ---------------------------
 * These imports used to sit at the top of HardwarePage, so three.js,
 * react-three-fiber and drei were pulled into the route's dependency graph and
 * downloaded on every visit -- even though the board is behind a click, and
 * even for the majority of visitors who never press it. The placeholder called
 * itself "zero GPU cost", which was true of the GPU and untrue of the network.
 *
 * HardwarePage now lazy()-imports this file and only renders it once
 * canvasActive is set, so the three.js chunk is fetched at click time. It is
 * the heaviest route on the site and the one Lighthouse scores lowest, so the
 * bytes are worth deferring.
 *
 * There is deliberately no useGLTF.preload here either. Reaching this module
 * already means the viewer is being opened, and useGLTF fetches PCB.gltf on
 * the first render of PCBModel below.
 */

// ─── Camera presets (unit direction vectors -- distance computed by Bounds.fit) ─
const CAM_DIRS = {
  topdown:   new THREE.Vector3(0,    1,     0.001),
  isometric: new THREE.Vector3(1,    1,     1    ),
  bottom:    new THREE.Vector3(0,   -1,     0.001),
  reset:     new THREE.Vector3(0.5,  0.8,   1    ),
}

// ─── BPM pulse ────────────────────────────────────────────────────────────────
function bpmPhase(elapsedSecs, bpm) {
  const t = (elapsedSecs % (60 / bpm)) / (60 / bpm)
  return Math.max(0, Math.sin(t * Math.PI * 2)) ** 2
}

// ─── Camera controller (must live inside <Bounds> to use useBounds) ──────────
function CameraController() {
  const { camera, controls } = useThree()
  const bounds        = useBounds()
  const pcbCommand    = useAppStore((s) => s.pcbCommand)
  const setPcbCommand = useAppStore((s) => s.setPcbCommand)

  // Initial fit once geometry is available
  useEffect(() => {
    const id = setTimeout(() => bounds.refresh().clip().fit(), 100)
    return () => clearTimeout(id)
  }, [bounds])

  useEffect(() => {
    if (!pcbCommand) return
    const dir = (CAM_DIRS[pcbCommand] ?? CAM_DIRS.reset).clone().normalize()
    camera.position.copy(dir.multiplyScalar(10))
    camera.lookAt(0, 0, 0)
    bounds.refresh().clip().fit()
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
    setPcbCommand(null)
  }, [pcbCommand, bounds, camera, controls, setPcbCommand])

  return null
}

// ─── PCB model ────────────────────────────────────────────────────────────────
function PCBModel({ xray }) {
  const { scene } = useGLTF('/PCB.gltf')
  const bpm       = useAppStore((s) => s.bpm)
  const { clock } = useThree()

  const boardMat = useRef(null)
  const ledMats  = useRef([])
  const primed   = useRef(false)

  useEffect(() => {
    if (primed.current) return
    primed.current = true

    scene.traverse((obj) => {
      if (!obj.isMesh) return
      if (!obj.name.startsWith('Open CASCADE')) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      const cloned = mats.map((m) => {
        const c = m.clone()
        c.polygonOffset = true; c.polygonOffsetFactor = -1
        // Boost reflectivity for Frutiger Aero glass-metal aesthetic
        if (c.metalness !== undefined) c.metalness = Math.max(c.metalness, 0.72)
        if (c.roughness !== undefined) c.roughness = Math.min(c.roughness, 0.28)
        return c
      })
      obj.material = cloned.length === 1 ? cloned[0] : cloned
      boardMat.current = cloned
    })

    const collected = []
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return
      let p = obj.parent; let underLED = false
      while (p) { if (p.name === 'WP7113') { underLED = true; break }; p = p.parent }
      if (!underLED) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      const cloned = mats.map((m) => {
        const c = m.clone()
        if (c.color.r > 0.9 && c.color.g > 0.9 && c.color.b > 0.9) {
          c.emissive = new THREE.Color(1, 0.95, 0.8); c.emissiveIntensity = 0
        }
        return c
      })
      obj.material = cloned.length === 1 ? cloned[0] : cloned
      cloned.forEach((m) => { if (m.color.r > 0.9 && m.color.g > 0.9 && m.color.b > 0.9) collected.push(m) })
    })
    ledMats.current = collected
  }, [scene])

  useEffect(() => {
    if (!boardMat.current) return
    boardMat.current.forEach((m) => {
      m.transparent = xray; m.opacity = xray ? 0.18 : 1.0; m.needsUpdate = true
    })
  }, [xray])

  useFrame(() => {
    if (!ledMats.current.length) return
    const pulse = bpmPhase(clock.elapsedTime, bpm)
    for (const m of ledMats.current) m.emissiveIntensity = 0.05 + pulse * 4.0
  })

  return <primitive object={scene} />
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function PCBScene({ xray }) {
  return (
    <>
      <ambientLight intensity={1.8} color="#c8d8f0" />
      <directionalLight position={[4, 6, 4]}   intensity={3.5} color="#00E5FF" />
      <directionalLight position={[-3, 4, -2]}  intensity={2.0} color="#00FFAA" />
      <directionalLight position={[0, -3, 2]}   intensity={1.2} color="#ffffff" />
      <directionalLight position={[0, 8, 0]}    intensity={2.5} color="#ddeeff" />
      <pointLight       position={[0, 3, 3]}    intensity={4.0} color="#ffffff" distance={12} decay={2} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={0.01}
        maxDistance={5.0}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.6}
        autoRotate
        autoRotateSpeed={0.6}
        touches={{ ONE: 0 /* ROTATE */, TWO: 2 /* DOLLY_PAN */ }}
        enableDamping
        dampingFactor={0.08}
      />

      <Bounds fit clip margin={1.4} observe>
        <CameraController />
        <Suspense fallback={null}>
          <PCBModel xray={xray} />
        </Suspense>
      </Bounds>
    </>
  )
}

export default function PCBViewer({ xray }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      camera={{ position: [1, 1.2, 1.8], fov: 45 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <PCBScene xray={xray} />
    </Canvas>
  )
}
