import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import { damp } from 'maath/easing'
import * as THREE from 'three'
import { useUI } from '../../context/UIContext'
import ErrorBoundary from '../ui/ErrorBoundary'

function proxied(url) {
  if (!url) return null
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

// ─── Y-Stack ──────────────────────────────────────────────────────────────────
// Plinth top surface : Y = 0.000
// Record disc base   : Y = 0.002  (group center Y = 0.022)
// Record top surface : Y = 0.042
// Label / tonearm    : Y = 0.043

// ─── Tonearm geometry constants ───────────────────────────────────────────────
// Pivot at world (1.72, 0.043, -0.55).
// Stylus tip in pivot-local space: approx [-1.368, ...] (new longer arm).
//
// rotation.y  →  stylus lands on record (recalculated for stylus at local [-1.368, _, 0.018])
//   1.25 rad  →  parked (R≈1.51, just outside record edge)
//   1.18 rad  →  outer groove (R≈1.41, near vinyl edge)
//   0.50 rad  →  inner groove (R≈0.54, near label)
const TONEARM_REST     = 1.25   // parked angle (rad) -- just off the record edge
const TONEARM_PLAY     = 1.22   // outer groove -- drops here first
const TONEARM_INNER    = 0.62   // inner groove -- R≈0.67, stops just outside label edge (R=0.60)
const RAISE_HEIGHT     = 0.14   // how far the STYLUS END lifts when cued up
const PIVOT_BASE_Y     = 0.110  // pivot Y: stylus tip (local -0.068) lands on vinyl surface Y=0.042
const TRACKING_SECS    = 120    // seconds to sweep outer → inner (slow, realistic)

// Cueing rotates the arm about its bearing rather than translating the whole
// pivot upward. Raising the pivot lifted the arm clear of the bearing post it
// is supposed to be mounted on, which is what made it look like it was floating
// free of the deck. Rotating keeps the bearing fixed, and the counterweight
// dips as the stylus rises -- the see-saw a real arm actually does.
const ARM_REACH  = 1.368                                  // pivot → stylus, in pivot-local X
const LIFT_ANGLE = -Math.asin(RAISE_HEIGHT / ARM_REACH)   // ≈ -0.1025 rad; negative lifts the -X end

// Arm state machine
const ARM = { PARKED: 0, SWINGING: 1, DROPPING: 2, PLAYING: 3 }

// The platter is NOT centred on the plinth -- on a Rega the spindle sits left
// of centre with the arm occupying the space to its right. Modelling it
// dead-centre left a large empty black expanse on the left of the deck.
//
// The deck size is a COMPROMISE, and worth being honest about, because the
// model is not internally consistent with a real Rega. Measured against the
// platter it was already right: platter radius / deck width was 0.336, and a
// Rega's is 150/447 = 0.336. Measured against the ARM it is not: a Rega's
// pivot-to-spindle distance is 222/447 = 0.497 of the deck width, and this
// arm's is 1.72/4.52 = 0.38. The modelled arm is proportionally shorter than a
// real one.
//
// Both cannot be satisfied at once, and the arm is the piece that cannot move:
// its play/inner angles and lift geometry are calibrated to the pivot position,
// so shifting it would break the tracking sweep. So the deck is sized to sit
// correctly around BOTH -- enough clearance past the platter on the left,
// enough deck past the pivot on the right -- rather than to a spec it cannot
// actually honour.
const PLINTH_W        = 4.15
const PLINTH_D        = 3.50
const PLINTH_OFFSET_X = 0.20

// ─── Procedural vinyl surface maps ────────────────────────────────────────────
//
// Two data textures, generated per-texel in polar space:
//
//   normal     -- groove micro-relief. A real LP has ~700 grooves per side, which
//                is far past Nyquist for any texture we can afford; drawing them
//                as hard rings is what produced the moire banding. This uses a
//                smooth cosine slope instead, which mips cleanly, and leans on
//                the anisotropic highlight to actually read as grooves.
//
//   anisotropy -- per-texel direction field. three interprets R/G as a vector in
//                tangent/bitangent space and B as strength. Grooves run
//                circumferentially, so the direction is perpendicular to the
//                radius and rotates around the disc -- a single constant
//                anisotropyRotation is only correct along one line, which is why
//                the old highlight looked painted on rather than swept.
//
// The specular streak on a record elongates PERPENDICULAR to the grooves, i.e.
// radially, which is the bright bar you see sweeping across a real record.
// Sampling budget, worked out rather than guessed. The groove band spans
// (EDGE_R - LABEL_R) = 0.585 of the radius, so at texture size S it occupies
// 0.585 * S/2 pixels and carries 0.585 * GROOVES cycles. Keeping that at
// >= 4 px per cycle stays clear of Nyquist and stops the rings beating against
// the pixel grid into moire. At 1536 / 160: 449 px, 94 cycles, 4.8 px/cycle.
const NRM_SIZE = 1536
const ANI_SIZE = 512      // a smooth direction field; needs no detail
const GROOVES  = 160
const LABEL_R  = 0.40
const EDGE_R   = 0.985
const FEATHER  = 0.025   // radial width of the fade at each band boundary

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
// 0 over the label, 1 across the playing surface, 0 past the lead-out.
const bandMask = (r) =>
  smoothstep(LABEL_R, LABEL_R + FEATHER, r) * (1 - smoothstep(EDGE_R - FEATHER, EDGE_R, r))

function useVinylMaps() {
  const { gl } = useThree()

  return useMemo(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy()

    const build = (size, write) => {
      const cv = document.createElement('canvas')
      cv.width = cv.height = size
      const ctx = cv.getContext('2d')
      const img = ctx.createImageData(size, size)
      const c = size / 2
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = (x - c) / c
          const dy = (y - c) / c
          const r  = Math.hypot(dx, dy)
          const ux = r > 1e-6 ? dx / r : 0
          const uy = r > 1e-6 ? dy / r : 0
          write(img.data, (y * size + x) * 4, r, ux, uy)
        }
      }
      ctx.putImageData(img, 0, 0)
      const t = new THREE.CanvasTexture(cv)
      t.colorSpace = THREE.NoColorSpace   // data, not colour
      t.anisotropy = maxAniso             // kills the grazing-angle shimmer
      t.generateMipmaps = true
      t.minFilter = THREE.LinearMipmapLinearFilter
      t.magFilter = THREE.LinearFilter
      t.needsUpdate = true
      return t
    }

    // Height field h(r) = sin(r * GROOVES * 2pi); the normal tilts along the
    // radius by its derivative. The band is faded in and out rather than cut
    // dead at its bounds: a step change in the normal field leaves a
    // discontinuity that catches the specular at grazing angles and reads as a
    // stippled ring around the rim.
    const normalMap = build(NRM_SIZE, (d, i, r, ux, uy) => {
      const slope = bandMask(r) * Math.cos(r * GROOVES * Math.PI * 2)
      d[i]     = 128 - slope * ux * 110
      d[i + 1] = 128 - slope * uy * 110
      d[i + 2] = 255
      d[i + 3] = 255
    })

    // Groove tangent = radius rotated 90 degrees.
    const anisotropyMap = build(ANI_SIZE, (d, i, r, ux, uy) => {
      d[i]     = 128 - uy * 127
      d[i + 1] = 128 + ux * 127
      d[i + 2] = 30 + bandMask(r) * 225
      d[i + 3] = 255
    })

    return { normalMap, anisotropyMap }
  }, [gl])
}

// Discogs art is frequently a photograph of the sleeve with dead space around
// it, so a plain cover-fit crop still leaves the artwork as a small square
// floating in the middle of the label. Find the real content instead: sample a
// small copy, treat the corner pixel as the background, and take the bounding
// box of everything that differs from it. Falls back to the full frame when the
// artwork genuinely bleeds to its edges.
function contentBounds(img, threshold = 26) {
  const N = 64
  const cv = document.createElement('canvas')
  cv.width = cv.height = N
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, N, N)
  const d = ctx.getImageData(0, 0, N, N).data
  const at = (i, j) => { const o = (j * N + i) * 4; return [d[o], d[o + 1], d[o + 2]] }
  const bg = at(0, 0)

  let x0 = N, y0 = N, x1 = -1, y1 = -1
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const p = at(i, j)
      if (Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > threshold) {
        if (i < x0) x0 = i
        if (i > x1) x1 = i
        if (j < y0) y0 = j
        if (j > y1) y1 = j
      }
    }
  }
  if (x1 < x0 || y1 < y0) return { sx: 0, sy: 0, sw: img.width, sh: img.height }

  const kx = img.width / N
  const ky = img.height / N
  return { sx: x0 * kx, sy: y0 * ky, sw: (x1 - x0 + 1) * kx, sh: (y1 - y0 + 1) * ky }
}

// ─── Album label ──────────────────────────────────────────────────────────────
function AlbumLabel({ coverUrl }) {
  const source = useTexture(coverUrl)
  const { gl }  = useThree()

  // Discogs art is a square sleeve scan. Mapping it straight onto circleGeometry
  // stretched that square across the disc's bounding box, so the sleeve's white
  // margin and its straight edges stayed visible inside the label. Compose a
  // real label instead: centre-crop the art under a circular clip, ring it with
  // a die-cut edge, and punch the spindle hole.
  // Safe to canvas-composite: /api/image-proxy is same-origin, so the image
  // never taints the canvas (a tainted canvas would throw on texImage2D).
  const labelTex = useMemo(() => {
    const S   = 1024
    const cv  = document.createElement('canvas')
    cv.width  = cv.height = S
    const ctx = cv.getContext('2d')
    const img = source.image

    ctx.save()
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#15151b'
    ctx.fillRect(0, 0, S, S)
    if (img && img.width) {
      // Trim the sleeve's dead space, then cover-fit the remaining artwork so it
      // fills the circle and crops the overflow, never letterboxes.
      const { sx, sy, sw, sh } = contentBounds(img)
      const scale = Math.max(S / sw, S / sh)
      const w = sw * scale
      const h = sh * scale
      ctx.drawImage(img, sx, sy, sw, sh, (S - w) / 2, (S - h) / 2, w, h)
    }
    ctx.restore()

    // Die-cut rim, then the spindle hole
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth   = S * 0.02
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S / 2 - ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#08080c'
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S * 0.030, 0, Math.PI * 2)
    ctx.fill()

    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = gl.capabilities.getMaxAnisotropy()
    t.needsUpdate = true
    return t
  }, [source, gl])

  useEffect(() => () => labelTex.dispose(), [labelTex])

  return (
    <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.6, 128]} />
      {/* No emissive: paper does not glow, and a white emissive layered onto an
          over-exposed scene is what washed the artwork out. */}
      <meshStandardMaterial map={labelTex} roughness={0.85} metalness={0.0} envMapIntensity={0.6} />
    </mesh>
  )
}

function PlainLabel() {
  return (
    <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.6, 128]} />
      <meshStandardMaterial color="#0d0d1a" roughness={0.6} />
    </mesh>
  )
}

// ─── Vinyl disc -- anisotropic PBR, RPM-linked rotation ───────────────────────
function VinylRecord({ coverUrl }) {
  const groupRef = useRef()
  const proxyUrl = proxied(coverUrl)
  const { rpm }  = useUI()
  const { normalMap, anisotropyMap } = useVinylMaps()

  // Vinyl is PVC: a dielectric, so metalness is 0 and its near-black albedo is
  // what makes it dark -- the previous metalness 0.88 turned it into a black
  // metal with almost no diffuse response. Gloss comes from the clearcoat.
  // cylinderGeometry emits three groups (side, top, bottom); giving the rim its
  // own plain material keeps the polar groove maps off the edge, where their
  // planar UVs would smear into vertical streaks.
  const [faceMat, rimMat] = useMemo(() => {
    const face = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#08080a'),
      metalness: 0.0,
      roughness: 0.34,
      ior: 1.54,
      normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      anisotropy: 0.9,
      anisotropyMap,
      // clearcoatRoughness 0.09 was a near-mirror: viewed from directly above,
      // the disc reflected the whole overhead panel and read light grey rather
      // than black. Blurring the coat keeps the body dark and lets the
      // anisotropic streak be the thing that catches the light.
      clearcoat: 1.0,
      clearcoatRoughness: 0.16,
      envMapIntensity: 0.85,
    })
    const rim = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a0a0c'),
      metalness: 0.0,
      roughness: 0.42,
      ior: 1.54,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.0,
    })
    return [face, rim]
  }, [normalMap, anisotropyMap])

  useEffect(() => () => {
    normalMap.dispose()
    anisotropyMap.dispose()
    faceMat.dispose()
    rimMat.dispose()
  }, [normalMap, anisotropyMap, faceMat, rimMat])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // rpm → rad/s: (rpm / 60) × 2π
    groupRef.current.rotation.y += delta * (rpm / 60) * Math.PI * 2
  })

  return (
    <group ref={groupRef} position={[0, 0.022, 0]}>
      {/* material order matches cylinderGeometry's groups: side, top, bottom */}
      <mesh name="Vinyl_Disc" castShadow receiveShadow material={[rimMat, faceMat, faceMat]}>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 256]} />
      </mesh>

      {proxyUrl ? (
        <ErrorBoundary fallback={<PlainLabel />}>
          <Suspense fallback={<PlainLabel />}>
            <AlbumLabel coverUrl={proxyUrl} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <PlainLabel />
      )}
    </group>
  )
}

// ─── Tonearm -- arc pivot + needle drop state machine ─────────────────────────
//
// States:
//   PARKED   -- arm at REST angle, pivot raised RAISE_HEIGHT above surface
//   SWINGING -- arm rotating toward play angle, still raised
//   DROPPING -- arm reached angle, pivot damping down to surface
//   PLAYING  -- pivot at surface, tracking inward over TRACKING_SECS
//
// maath/easing `damp(obj, key, target, smoothTime, delta)` produces a
// critically-damped spring -- organic deceleration with no overshoot.
function Tonearm({ isPlaying }) {
  const groupRef    = useRef()
  const stateRef    = useRef(ARM.DROPPING)  // skip swing, drop straight down at outer groove
  const progressRef = useRef(0)   // 0 = outer groove, 1 = inner groove

  // Transition PARKED → SWINGING when isPlaying fires
  useEffect(() => {
    if (isPlaying && stateRef.current === ARM.PARKED) {
      stateRef.current = ARM.SWINGING
    }
    if (!isPlaying) {
      stateRef.current = ARM.PARKED
      progressRef.current = 0
    }
  }, [isPlaying])

  useFrame((_, delta) => {
    const arm = groupRef.current
    if (!arm) return

    // Current groove angle from playback progress
    const targetAngle = TONEARM_PLAY + (TONEARM_INNER - TONEARM_PLAY) * progressRef.current

    switch (stateRef.current) {
      case ARM.PARKED:
        // Return to rest -- fast enough to feel snappy, not instant
        damp(arm.rotation, 'y', TONEARM_REST, 0.35, delta)
        damp(arm.rotation, 'z', LIFT_ANGLE, 0.25, delta)
        break

      case ARM.SWINGING:
        // Swing slowly, stay cued up -- smoothTime=0.9 gives deliberate mechanical feel
        arm.rotation.z = LIFT_ANGLE
        damp(arm.rotation, 'y', targetAngle, 0.9, delta)
        // Transition once angle is settled (< 0.004 rad ≈ 0.23°)
        if (Math.abs(arm.rotation.y - targetAngle) < 0.004) {
          stateRef.current = ARM.DROPPING
        }
        break

      case ARM.DROPPING:
        // Hold angle precisely, lower the stylus onto the groove
        arm.rotation.y = targetAngle
        damp(arm.rotation, 'z', 0, 0.4, delta)
        if (Math.abs(arm.rotation.z) < 0.0006) {
          arm.rotation.z = 0
          stateRef.current = ARM.PLAYING
        }
        break

      case ARM.PLAYING:
        // Track inward -- update progress, damp rotation to follow
        progressRef.current = Math.min(1, progressRef.current + delta / TRACKING_SECS)
        damp(arm.rotation, 'y', targetAngle, 0.08, delta)
        arm.rotation.z = 0
        break
    }
  })

  // Euler order XYZ composes as Rx*Ry*Rz, so the z tilt is applied in the arm's
  // own frame first and the y swing then carries it around -- exactly the order a
  // real bearing constrains. Pivot Y is now fixed.
  return (
    <group ref={groupRef} position={[1.72, PIVOT_BASE_Y, -0.55]} rotation={[0, TONEARM_PLAY, LIFT_ANGLE]}>

      {/* ── Bearing housing (pivot cup) ──
          Everything on this arm was #111111 at roughness 0.35, which on a black
          plinth against a black backdrop gave the whole assembly no silhouette:
          it read as a scratch on the image rather than a machined part. The
          tube, housing and stub are a touch lighter and glossier now so they
          pick up the rim light and describe their own shape. The geometry is
          unchanged -- it was already right. */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.062, 0.075, 28]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.28} envMapIntensity={0.9} />
      </mesh>

      {/* ── Main arm tube -- Rega straight matte black tube ── */}
      <mesh position={[-0.62, 0.005, 0]} rotation={[0, 0, Math.PI / 2 - 0.04]} castShadow>
        <cylinderGeometry args={[0.0165, 0.021, 1.24, 24]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.26} envMapIntensity={0.9} />
      </mesh>

      {/* ── Rear stub (counterweight arm) ── */}
      <mesh position={[0.28, 0.003, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.017, 0.019, 0.46, 20]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.28} envMapIntensity={0.9} />
      </mesh>

      {/* ── Counterweight -- Rega grey/silver cylinder ── */}
      <mesh position={[0.55, 0, 0]} castShadow>
        <cylinderGeometry args={[0.062, 0.062, 0.095, 32]} />
        <meshStandardMaterial color="#7e8288" metalness={0.9} roughness={0.16} envMapIntensity={1.0} />
      </mesh>
      {/* Counterweight threading ring */}
      <mesh position={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.018, 32]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.92} roughness={0.09} envMapIntensity={1.1} />
      </mesh>

      {/* ── Headshell offset group -- ~22° Y rotation so cartridge runs tangent to groove ── */}
      <group position={[-1.20, 0, 0]} rotation={[0, -0.38, 0]}>

        {/* Headshell connector -- matte black */}
        <mesh position={[-0.04, -0.012, 0]} rotation={[0.10, 0, -0.10]}>
          <boxGeometry args={[0.115, 0.018, 0.038]} />
          <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.35} />
        </mesh>

        {/* Cartridge body -- dark, slight gloss */}
        <mesh position={[-0.11, -0.026, 0]} rotation={[0.10, 0, 0]}>
          <boxGeometry args={[0.095, 0.030, 0.052]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.45} />
        </mesh>

        {/* Cantilever */}
        <mesh position={[-0.16, -0.048, 0]} rotation={[0.5, 0, 0.05]}>
          <cylinderGeometry args={[0.0018, 0.0012, 0.055, 6]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Stylus tip */}
        <mesh position={[-0.168, -0.068, 0]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
        </mesh>

      </group>

    </group>
  )
}

// ─── Plinth ────────────────────────────────────────────────────────────────────
function Plinth({ isPlaying }) {
  return (
    <group>
      {/* Plinth body.
          Was 3.8 x 3.7 -- nearly square, which is why it read as a slab with a
          lot of dead deck around the platter. A Rega P2 is 447 x 360 mm around a
          300 mm platter, so against this platter's 3.04 diameter the width
          should be 1.49x it (4.53) and the depth 1.20x (3.65). The depth was
          already right; the WIDTH was the wrong one, short by 0.7.

          envMapIntensity up from 0.32. Piano black on a near-black backdrop had
          no silhouette at all -- the edges simply dissolved into the background
          and the deck read as a void rather than an object. It needs to catch
          enough of the environment to describe its own edges. */}
      <mesh position={[PLINTH_OFFSET_X, -0.095, 0]} receiveShadow castShadow>
        <boxGeometry args={[PLINTH_W, 0.19, PLINTH_D]} />
        {/* Piano black, but NOT a mirror: at roughness 0.10 the plinth reflected
            the softbox as a hard white slab with a visible straight edge. The
            rougher clearcoat blurs that into a soft sheen. */}
        <meshPhysicalMaterial color="#121215" roughness={0.34} metalness={0.0} reflectivity={0.45} clearcoat={1.0} clearcoatRoughness={0.26} envMapIntensity={0.55} />
      </mesh>

      {/* Feet. Four of them, inset from the corners like the real deck's. They
          are barely visible from a normal orbit, and that is not the point: they
          lift the plinth off the contact shadow so it reads as an object sitting
          on a surface rather than a rectangle printed on the backdrop. */}
      {[[-1.72, -1.36], [1.72, -1.36], [-1.72, 1.36], [1.72, 1.36]].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x + PLINTH_OFFSET_X, -0.235, z]} castShadow>
          <cylinderGeometry args={[0.115, 0.13, 0.09, 24]} />
          <meshStandardMaterial color="#0b0b0d" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}

      {/* Glass platter -- Rega's teal-tinted glass. transmission needs a separate
          render pass per frame and the platter is almost entirely hidden under
          the record, so this approximates it with a cheap tinted dielectric. */}
      <mesh position={[0, 0.012, 0]} receiveShadow>
        <cylinderGeometry args={[1.52, 1.52, 0.024, 128]} />
        {/* Darker and less reflective than it was (#2f6f68 at envMapIntensity
            0.9). A Rega glass platter does show a green edge, but at those
            values the rim was the brightest object in the frame -- brighter than
            the record, the label or the arm -- which inverts what the eye should
            land on. It is an edge detail, not the subject. */}
        <meshPhysicalMaterial
          color="#224a46"
          roughness={0.16}
          metalness={0.0}
          ior={1.52}
          clearcoat={1.0}
          clearcoatRoughness={0.14}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Felt mat -- Rega dark charcoal felt, sits on glass platter */}
      <mesh position={[0, 0.027, 0]}>
        <cylinderGeometry args={[1.49, 1.49, 0.008, 128]} />
        <meshStandardMaterial color="#252525" roughness={0.97} metalness={0.0} />
      </mesh>

      {/* Spindle. Was 0.016 radius in #aaaaaa, which against a bright label read
          as a speck of dirt rather than a machined pin -- and the centre of the
          record is exactly where the eye goes. Slightly wider, brighter and
          smoother so it reads as chrome. */}
      <mesh position={[0, 0.060, 0]} castShadow>
        <cylinderGeometry args={[0.021, 0.022, 0.062, 24]} />
        <meshStandardMaterial color="#d2d4d8" metalness={0.95} roughness={0.12} envMapIntensity={1.1} />
      </mesh>
      {/* Domed top, so it catches a highlight instead of showing a flat disc */}
      <mesh position={[0, 0.091, 0]}>
        <sphereGeometry args={[0.021, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dcdee2" metalness={0.95} roughness={0.10} envMapIntensity={1.2} />
      </mesh>

      {/* Tonearm bearing post. It was 0.34 tall (top at y=0.34) while the pivot
          sits at y=0.110, so the pillar speared up past the arm and the two read
          as unrelated objects. It now terminates just inside the bearing
          housing, which straddles y=0.08..0.14. */}
      <mesh position={[1.72, (PIVOT_BASE_Y + 0.02) / 2, -0.55]} castShadow>
        <cylinderGeometry args={[0.062, 0.075, PIVOT_BASE_Y + 0.02, 24]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.28} envMapIntensity={0.9} />
      </mesh>
      {/* Base collar where the post meets the deck. Without it the post grew
          straight out of the plinth with no join, which is the detail that most
          made the arm look dropped in rather than mounted. */}
      <mesh position={[1.72, 0.008, -0.55]} castShadow>
        <cylinderGeometry args={[0.115, 0.125, 0.016, 28]} />
        <meshStandardMaterial color="#191919" metalness={0.7} roughness={0.35} envMapIntensity={0.8} />
      </mesh>

      <Tonearm isPlaying={isPlaying} />
    </group>
  )
}

// ─── Responsive framing ───────────────────────────────────────────────────────
/**
 * Pushes the camera back just far enough that the deck fits BOTH axes.
 *
 * three's `fov` is vertical, so a fixed camera position only frames correctly at
 * one aspect ratio. Tuned on a wide desktop window it cut the deck off at the
 * left and right edges on anything squarer -- which is every phone, where the
 * horizontal field runs out first.
 *
 * Fitting a bounding SPHERE is the obvious approach and it is wrong here: this
 * object is flat. Its projected vertical extent is about 1.31, while the sphere
 * enclosing it has radius 2.85, so a sphere fit pulls back more than twice as
 * far as needed and strands the deck in the middle of an empty frame.
 *
 * So fit the real projected extents: take the object's bounding box, resolve
 * each corner onto the camera's right and up axes, and solve each field of view
 * against the extent that actually faces it.
 */
const VIEW_DIR = new THREE.Vector3(0, 3.9, 4.95).normalize()
const FIT_MARGIN = 1.07

// Bounds relative to the look-at target, taken from the geometry above rather
// than eyeballed: half the deck in X and Z, and in Y from the underside of the
// feet to the top of the counterweight.
const HALF_X = PLINTH_W / 2
const HALF_Z = PLINTH_D / 2
const MIN_Y = -0.28
const MAX_Y = 0.20

function FitCamera() {
  const { camera, size, controls } = useThree()

  useEffect(() => {
    const target = new THREE.Vector3(PLINTH_OFFSET_X, 0, 0)
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), VIEW_DIR).normalize()
    const up = new THREE.Vector3().crossVectors(VIEW_DIR, right).normalize()

    const vFov = THREE.MathUtils.degToRad(camera.fov)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / size.height))
    const tanV = Math.tan(vFov / 2)
    const tanH = Math.tan(hFov / 2)

    /* Solved per corner WITH its depth, not as a flat extent. A corner nearer
       the camera projects larger, and the deck's front corners sit over a
       metre closer than the spindle -- ignoring that left them clipped off the
       bottom of the frame even though the parallel-projection extents said
       everything fitted.
       For a corner at c, its distance along the view axis is (d - c.dir), so it
       stays inside the frustum while |c.up| / (d - c.dir) <= tan(vFov/2).
       Rearranged, each corner demands d >= |c.up|/tan + c.dir; take the
       greediest. */
    let dist = 0
    for (const x of [-HALF_X, HALF_X]) {
      for (const y of [MIN_Y, MAX_Y]) {
        for (const z of [-HALF_Z, HALF_Z]) {
          const c = new THREE.Vector3(x, y, z)
          const along = c.dot(VIEW_DIR)
          dist = Math.max(
            dist,
            Math.abs(c.dot(up)) / tanV + along,
            Math.abs(c.dot(right)) / tanH + along,
          )
        }
      }
    }
    dist *= FIT_MARGIN

    camera.position.copy(VIEW_DIR).multiplyScalar(dist).add(target)
    camera.updateProjectionMatrix()
    /* Only on mount and resize. OrbitControls owns the camera after that, and
       re-running this every frame would fight the user's drag. */
    if (controls) { controls.target.copy(target); controls.update() }
  }, [camera, size, controls])

  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function TurntableScene({ release, isPlaying }) {
  return (
    <>
      {/* Dark studio backdrop. A glossy black object reads through its specular
          reflections, not through ambient fill, so the old flat mid-blue plus
          heavy ambient was actively fighting the material. */}
      <color attach="background" args={['#0d1017']} />

      {/* Procedural HDRI. Anisotropy and clearcoat are reflection-driven -- with
          no environment they have nothing to mirror and fall flat, which is why
          the old scene needed ten lights to look lit at all. Built from
          Lightformers rather than an .hdr file: the CSP here is
          connect-src 'self', so an external HDR fetch would be blocked.
          frames={1} bakes the cubemap once. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#10131a']} />
        {/* Overhead fill, deliberately SMALL and dim. A 12x8 softbox at
            intensity 5 subtends most of the reflection hemisphere, so a glossy
            plinth mirrors it as a hard-edged white slab and the disc washes out
            to grey when viewed from above. Gloss should reflect a mostly dark
            room punctuated by small bright sources, not one huge panel. */}
        <Lightformer form="rect" intensity={1.1} color="#ffffff"
          position={[0, 6, 1]} rotation={[-Math.PI / 2, 0, 0]} scale={[5, 4, 1]} />
        {/* Long thin strip: this is what draws the classic radial streak that
            sweeps across a spinning record. Small solid angle, high intensity --
            bright highlight, negligible overall lift. */}
        <Lightformer form="rect" intensity={9} color="#fff4e6"
          position={[-3.5, 4, 2]} rotation={[-Math.PI / 3, -0.4, 0]} scale={[0.5, 7, 1]} />
        {/* Second, tighter strip from the opposite side for a twin sweep */}
        <Lightformer form="rect" intensity={5} color="#e8f0ff"
          position={[3.2, 3.6, 1.2]} rotation={[-Math.PI / 3, 0.5, 0]} scale={[0.35, 6, 1]} />
        {/* Cool rim from behind, separates the black rim from the black backdrop */}
        <Lightformer form="rect" intensity={2.2} color="#bcd4ff"
          position={[3, 3, -5]} rotation={[Math.PI / 5, Math.PI, 0]} scale={[6, 2, 1]} />
        {/* A LOW, WIDE rim behind the deck, close to the height of the plinth
            itself. The rim above was aimed at the platter and passed over the
            top of the plinth entirely, so a piano-black box on a near-black
            backdrop had no edge to catch and its silhouette simply vanished --
            the deck read as a hole in the image rather than an object. This sits
            at plinth height and skims the back and side edges. */}
        <Lightformer form="rect" intensity={3.2} color="#9fc0ff"
          position={[-1.5, 0.35, -4.2]} rotation={[0, Math.PI, 0]} scale={[7, 0.55, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#cfe0ff"
          position={[4.6, 0.5, -1.2]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 0.6, 1]} />
        {/* Low warm bounce, lifts the plinth face out of pure black */}
        <Lightformer form="rect" intensity={0.7} color="#ffd9b0"
          position={[0, -1.5, 5]} rotation={[Math.PI / 2, 0, 0]} scale={[7, 3, 1]} />
      </Environment>

      {/* Single shadow-casting key. The scene previously had shadows enabled on
          the Canvas but castShadow={false} on every light, so nothing grounded
          the deck and it appeared to float. */}
      <directionalLight
        position={[4.5, 7, 3.5]}
        intensity={2.2}
        color="#fff6ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      {/* Gentle ambient floor so shadow interiors are not crushed to pure black */}
      <ambientLight intensity={0.12} color="#aab8d0" />

      <VinylRecord coverUrl={release?.cover_image} />
      <Plinth isPlaying={isPlaying} />

      {/* Soft occlusion beneath the plinth -- grounds the deck in the scene.
          Dropped from -0.161 to sit under the FEET rather than through them.
          The plinth body now spans y -0.19..0 and the feet reach -0.28, so the
          old plane cut through both and the deck appeared to sink into its own
          shadow instead of standing on it. */}
      <ContactShadows
        position={[0, -0.287, 0]}
        scale={10}
        resolution={1024}
        blur={2.4}
        opacity={0.68}
        far={2.5}
        color="#000000"
      />

      <FitCamera />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        /* Was 8, which clamped the fitted distance on a narrow viewport and
           re-cropped the deck the fitter had just framed. */
        maxDistance={20}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 2.1}
        /* Aimed between the spindle and the plinth centre, not at the
           spindle. With the deck offset the object's visual centre is no longer
           the record, and orbiting about the record alone swung the plinth in
           and out of frame. */
        target={[PLINTH_OFFSET_X, 0, 0]}
        touches={{ ONE: 0 /* ROTATE */, TWO: 2 /* DOLLY_PAN */ }}
        enableDamping
        dampingFactor={0.07}
      />
    </>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function InteractiveTurntable({ release, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(3,7,18,0.94)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      role="dialog"
      aria-modal="true"
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 py-4 sm:px-10 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
          <span aria-hidden="true" className="material-symbols-rounded text-sm">close</span>
          ESC
        </button>
      </div>

      {/* ── Canvas -- fills all remaining space ── */}
      <div className="relative flex-1 min-h-0 w-full">
        <ErrorBoundary fallback={
          <img
            src="/display/RegaP2_VINYL.jpg"
            alt="Rega P2 turntable"
            className="w-full h-full object-cover"
            style={{ opacity: 0.7 }}
          />
        }>
          <Canvas
            shadows="soft"
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              // The scene previously set exposure 1.6 while leaving toneMapping at
              // its NoToneMapping default, so every highlight clipped straight to
              // white. ACES rolls the highlights off instead, which is what lets
              // the specular streak read as a streak rather than a white blob.
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0,
            }}
            /* Pulled back from [0, 3.4, 4.2]. The plinth is wider now, and at
               that distance its near corners fell outside the frame -- the deck
               was being cropped by the viewport, which is what made it read as
               a surface running off the edges rather than an object. Elevation
               is held at ~38 degrees, which is where the platter reads as a
               circle rather than a slot and the deck still shows its top face.
               <Bounds> would fit this automatically, but it and OrbitControls
               both drive the camera and the initial fit fights the first drag. */
            camera={{ position: [PLINTH_OFFSET_X, 3.9, 4.95], fov: 34 }}
            style={{ width: '100%', height: '100%' }}
          >
            <Suspense fallback={null}>
              <TurntableScene release={release} isPlaying={isPlaying} />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* ── Footer hint ── */}
      <div className="shrink-0 py-3 text-center">
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
          Drag to orbit · Scroll to zoom
        </p>
      </div>
    </div>,
    document.body
  )
}
