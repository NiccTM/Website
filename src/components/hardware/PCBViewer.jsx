import { useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds, useBounds, Environment, Lightformer } from '@react-three/drei'
// EffectComposer/Bloom removed -- @react-three/postprocessing has version conflicts that crash the Canvas
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/*
 * Everything that touches three.js lives in this file, and nothing else
 * imports it statically.
 *
 * WHY IT IS A SEPARATE MODULE
 * ---------------------------
 * These imports used to sit at the top of HardwarePage, so three.js,
 * react-three-fiber and drei were pulled into the route's dependency graph and
 * downloaded on every visit -- even though the board is behind a click, and
 * even for the majority of visitors who never press it.
 *
 * HardwarePage lazy()-imports this file and only renders it once canvasActive
 * is set, so the three.js chunk is fetched at click time.
 *
 * THE MODEL
 * ---------
 * /models/PCB.glb is built from the raw Open CASCADE export by
 * scripts/optimize-pcb.mjs, which is run by hand and its output committed. The
 * export was unusable as shipped, for reasons documented at length in that
 * script. The short version:
 *
 *   - it contained the entire board TWICE, at identical transforms, so every
 *     surface z-fought with a copy of itself;
 *   - all 13 materials omitted metallicFactor/roughnessFactor, and the glTF
 *     default for both is 1.0, so everything rendered as fully metallic. A
 *     metal has no diffuse term, so with nothing to reflect, every part came
 *     out a flat grey lump and the green substrate, gold pads and coloured
 *     component bodies never reached the screen at all;
 *   - it was 68,328 primitives, i.e. 68,328 draw calls per frame, for 98,336
 *     triangles of actual board -- 1.4 triangles per call.
 *
 * After the offline pass: 13 draw calls, correct PBR, 886 KB instead of 7.9 MB.
 * Two consequences for the code below.
 *
 * 1. There is no polygonOffset here any more. It was there to fight the
 *    z-fighting caused by the duplicated geometry; the duplicate is gone, so
 *    the offset is not treating anything.
 * 2. Parts are found BY MATERIAL NAME, not by node name. Merging by material
 *    is what collapses the draw calls, so node names do not survive it -- but
 *    the material names are assigned in the optimiser and are stable. Rename
 *    one there and you must rename it here.
 */

const MODEL_URL = '/models/PCB.glb'

/* useGLTF's second argument is useDraco. It defaults to TRUE, which constructs
   a DRACOLoader pointed at gstatic.com. The model is meshopt-compressed, not
   Draco, so that loader would never be used -- but this site's CSP is
   connect-src 'self' and there is no reason to leave a third-party fetch path
   wired up at all. Meshopt's decoder is bundled (drei gets it from three-stdlib
   and enables it by default), so nothing here touches the network.

   THE MESHOPT DECODER IS WEBASSEMBLY, AND THE CSP HAS TO ALLOW IT.
   vercel.json's script-src carries 'wasm-unsafe-eval' for this and only this.
   Without it WebAssembly.instantiate() throws a CSP CompileError, the model
   fails to load, and the whole viewer drops to its ErrorBoundary.

   This was shipped broken once: it was tested against a local static server
   that served no CSP headers at all, so it passed locally and failed on the
   first production load. Any local check of this route has to send the real
   headers or it is not testing the thing that breaks.

   'wasm-unsafe-eval' is the narrow directive meant for exactly this -- it
   permits WebAssembly compilation and nothing else. It does NOT permit eval()
   or new Function() on strings, which is what 'unsafe-eval' would have opened
   up. The binary is bundled in the site's own JS, so it is 'self' anyway. */
const USE_DRACO = false

// Material names assigned by scripts/optimize-pcb.mjs
const MAT_BOARD = 'board'
const MAT_LED   = 'led_lens'

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
    /* Only the DIRECTION matters. The old code multiplied by a hard-coded 10,
       which is meaningless without knowing the export's units, and then fought
       OrbitControls' distance clamp for the result. Bounds.fit() sets the
       distance from the actual bounding sphere, so the position here just has
       to be on the right ray. */
    const dir = (CAM_DIRS[pcbCommand] ?? CAM_DIRS.reset).clone().normalize()
    camera.position.copy(dir.multiplyScalar(camera.position.length() || 1))
    camera.lookAt(0, 0, 0)
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
    bounds.refresh().clip().fit()
    setPcbCommand(null)
  }, [pcbCommand, bounds, camera, controls, setPcbCommand])

  return null
}

// ─── PCB model ────────────────────────────────────────────────────────────────
function PCBModel({ xray }) {
  const { scene } = useGLTF(MODEL_URL, USE_DRACO)
  const bpm       = useAppStore((s) => s.bpm)
  const { clock, controls } = useThree()

  /* useGLTF caches the parsed scene process-wide, so mutating its materials
     would leak into any future mount. Clone every material once, up front, and
     pick out the two we animate while we are already walking the graph.
     useMemo, not useEffect + refs: this is a derivation of `scene`, and doing
     it in an effect meant the first frame rendered against the shared,
     unmodified materials. */
  const { boardMats, ledMats } = useMemo(() => {
    const boardMats = []
    const ledMats   = []

    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      /* Components cast onto the board and onto each other. With no ground
         plane this is pure self-shadowing, which is the only depth cue a board
         lit by a broad environment gets -- without it the parts read as decals
         printed on a green rectangle. Affordable now: 13 draw calls means the
         shadow pass is 13 more, not 68,328 more. */
      obj.castShadow = true
      obj.receiveShadow = true

      const cloned = mats.map((m) => {
        const c = m.clone()
        if (c.name === MAT_LED) {
          /* The lens is lit from inside by the BPM pulse. emissive has to be a
             real colour with intensity driven to zero rather than a black
             emissive, because three multiplies the two and a black emissive
             can never be animated up. */
          c.emissive = new THREE.Color(1, 0.95, 0.8)
          c.emissiveIntensity = 0
          c.toneMapped = false
          ledMats.push(c)
        }
        if (c.name === MAT_BOARD) boardMats.push(c)
        return c
      })
      obj.material = cloned.length === 1 ? cloned[0] : cloned
    })

    return { boardMats, ledMats }
  }, [scene])

  /* X-ray fades the substrate so the copper and the parts on the far side show
     through. The old version assigned `boardMat.current = cloned` inside the
     traversal, overwriting it on every match -- so with three board meshes in
     the duplicated export, only the last one ever became transparent and the
     other two stayed opaque in front of it. Collecting into an array fixes
     that; the merge means there is only one now, but the bug was real. */
  useEffect(() => {
    for (const m of boardMats) {
      m.transparent = xray
      m.opacity     = xray ? 0.18 : 1.0
      m.depthWrite  = !xray
      m.needsUpdate = true
    }
  }, [xray, boardMats])

  /* Size the zoom limits AND the shadow frustum off the model, so both hold
     whatever units the export happens to use. The old code hard-coded
     minDistance 0.01 / maxDistance 5.0, which meant nothing without knowing the
     units and fought the camera every time a view preset ran. */
  const { scene: threeScene } = useThree()
  useEffect(() => {
    const sphere = new THREE.Box3().setFromObject(scene).getBoundingSphere(new THREE.Sphere())
    if (!sphere.radius) return

    if (controls) {
      controls.minDistance = sphere.radius * 0.55
      controls.maxDistance = sphere.radius * 6
      controls.update()
    }

    /* A directional light's shadow is an orthographic camera, and its extent is
       in world units. Left at the default +/-5 it either misses a model
       measured in millimetres entirely or wastes almost all of the shadow map's
       resolution on empty space around one measured in metres. */
    const key = threeScene.getObjectByName('pcb-key-light')
    if (key?.shadow) {
      const r = sphere.radius
      key.position.set(r * 1.6, r * 2.4, r * 1.6)
      const cam = key.shadow.camera
      cam.left = -r * 1.4; cam.right = r * 1.4
      cam.top  =  r * 1.4; cam.bottom = -r * 1.4
      cam.near = r * 0.1;  cam.far = r * 8
      cam.updateProjectionMatrix()
      key.shadow.bias = -0.0005 * r
      key.shadow.normalBias = 0.02 * r
    }
  }, [scene, controls, threeScene])

  useFrame(() => {
    if (!ledMats.length) return
    const pulse = bpmPhase(clock.elapsedTime, bpm)
    for (const m of ledMats) m.emissiveIntensity = 0.05 + pulse * 4.0
  })

  return <primitive object={scene} />
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function PCBScene({ xray }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <>
      {/* A board is mostly dielectric with metal plating on top, and both read
          through reflections. The previous scene had no environment at all and
          tried to compensate with six lights -- ambient 1.8, a cyan directional
          at 3.5, a green one at 2.0, two more, and a point light at 4.0. That
          is why the render came out washed and tinted: metals were reflecting
          nothing but a few coloured lobes.

          Built from Lightformers rather than an .hdr, matching
          InteractiveTurntable: the CSP here is connect-src 'self', so an
          external HDR fetch would be blocked. frames={1} bakes it once. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#0b1016']} />
        {/* Broad, dim overhead -- the "room". Keeps solder mask off pure black
            without flattening the specular. */}
        <Lightformer form="rect" intensity={0.9} color="#eef4ff"
          position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[6, 6, 1]} />
        {/* Tight bright strip: this is what puts a moving glint along the
            plated leads and the gold pads as the board turns. Small solid
            angle, high intensity. */}
        <Lightformer form="rect" intensity={7} color="#ffffff"
          position={[-3, 4, 2]} rotation={[-Math.PI / 3, -0.4, 0]} scale={[0.4, 6, 1]} />
        {/* Cooler second strip from the other side, so edges catch from both */}
        <Lightformer form="rect" intensity={4} color="#cfe4ff"
          position={[3, 3.5, 1.5]} rotation={[-Math.PI / 3, 0.5, 0]} scale={[0.3, 5, 1]} />
        {/* Rim from behind, separates the board edge from the page background */}
        <Lightformer form="rect" intensity={2} color="#9ec5ff"
          position={[2, 2.5, -5]} rotation={[Math.PI / 5, Math.PI, 0]} scale={[6, 2, 1]} />
        {/* Low bounce so the underside is not crushed when orbiting below */}
        <Lightformer form="rect" intensity={0.6} color="#ffe6c4"
          position={[0, -3, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 3, 1]} />
      </Environment>

      {/* One key for directional shape and the shadow pass, on top of the
          environment. Six lights at intensities of 2-4 were doing the
          environment's job badly. Its position and shadow frustum are set from
          the model's bounding sphere in PCBModel -- see pcb-key-light there. */}
      <directionalLight
        name="pcb-key-light"
        position={[4, 6, 4]}
        intensity={2.0}
        color="#fff6ec"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.15} color="#aab8d0" />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        /* min/maxDistance are set from the model's bounding sphere in PCBModel.
           They were hard-coded to 0.01 and 5.0, which had no relationship to
           the export's units and clamped the camera back on top of the board
           every time a view preset ran. */
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.6}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.6}
        touches={{ ONE: 0 /* ROTATE */, TWO: 2 /* DOLLY_PAN */ }}
        enableDamping
        dampingFactor={0.08}
      />

      {/* margin 1.05, not 1.4. 1.4 leaves 40% padding around the bounding
          sphere, and because the board is a flat slab its bounding sphere is
          dominated by the diagonal -- so the visible board ended up occupying
          about a third of the frame with dead space all round it. */}
      <Bounds fit clip margin={1.05} observe>
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
      /* logarithmicDepthBuffer removed. It makes every fragment shader write
         gl_FragDepth, which disables the GPU's early-Z rejection -- a real cost
         on every pixel, paid to solve a depth-precision problem this scene does
         not have. <Bounds clip> sets near/far from the actual bounding box, so
         the default depth buffer has precision to spare. */
      shadows
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      /* Capped at 1.5 rather than 2. A phone at dpr 3 was rendering 4x the
         fragments of dpr 1.5 for a difference that is not visible on a board
         this size, and fragment cost is what this scene is bound by now that
         the draw calls are gone. */
      dpr={[1, 1.5]}
      camera={{ position: [1, 1.2, 1.8], fov: 45 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <PCBScene xray={xray} />
    </Canvas>
  )
}
