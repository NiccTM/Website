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

// ─── Scale and Y-stack ────────────────────────────────────────────────────────
// 1 unit = 100 mm, fixed by the record: a 12" LP is 300 mm and the disc is
// modelled at radius 1.5.
//
// Dimensions are the real Planar 2's -- 447 x 360 mm deck, 10 mm Optiwhite
// glass platter, 12" so the SAME diameter as the record rather than smaller.
//
// The old stack was wrong in a way that hides head-on and shows the moment the
// camera drops: glass at 0.000..0.024 and record at 0.002..0.042, so the disc
// was sunk THROUGH both the platter and the felt mat instead of resting on
// them. The mint band under the record on a real deck is the 10 mm glass edge
// showing beneath the disc, which a 0.024-thick platter cannot produce -- so
// the model faked it by making the glass WIDER than the record and showing a
// ring around it. The photograph shows neither.
const GLASS_R    = 1.50   // 12" platter, same diameter as the LP
const GLASS_T    = 0.10   // 10 mm Optiwhite float glass
const MAT_R      = 1.42   // wool felt mat, inset so the glass rim stays visible
const MAT_T      = 0.02
const RECORD_R   = 1.50
const RECORD_T   = 0.04

const GLASS_Y0   = 0.02                                        // sub-platter gap
const GLASS_CY   = GLASS_Y0 + GLASS_T / 2                       // 0.070
const MAT_CY     = GLASS_Y0 + GLASS_T + MAT_T / 2               // 0.130
const RECORD_CY  = GLASS_Y0 + GLASS_T + MAT_T + RECORD_T / 2    // 0.160
const RECORD_TOP = RECORD_CY + RECORD_T / 2                     // 0.180

// ─── Tonearm sweep ────────────────────────────────────────────────────────────
// Pivot at world (PIVOT_X, PIVOT_BASE_Y, PIVOT_Z); stylus at pivot-local
// (STYLUS_X, _, STYLUS_Z), so the groove radius the stylus rides is
//   R(a) = |(PIVOT_X, PIVOT_Z) + R_y(a)·(STYLUS_X, STYLUS_Z)|
// Solved for R, not eyeballed.
//
// REST used to be the angle putting the stylus just past the rim. That parks
// the TIP off the disc but swings the tube across it -- the tube's closest
// approach was R=1.41, well inside the 1.50 record, so the arm rested over the
// vinyl with nothing under it. REST is now chosen so the whole arm clears,
// which is also what makes an arm rest possible to place at all.
const TONEARM_REST     = 1.180  // parked   -> stylus R 1.892, nearest tube point R 1.657
const TONEARM_PLAY     = 0.968  // lead-in  -> R 1.440, ~6 mm in from the rim
const TONEARM_INNER    = 0.615  // run-out  -> R 0.660, just outside the 0.60 label
const RAISE_HEIGHT     = 0.14   // how far the STYLUS END lifts when cued up
const TRACKING_SECS    = 120    // seconds to sweep outer → inner (slow, realistic)

// ── Arm tube, and everything hung off its end ────────────────────────────────
// The tube is described once and the headshell hangs off its COMPUTED end.
// Nothing downstream is a literal -- move the tube and the cartridge, the
// stylus, the pivot height and the cue angle all follow. That matters because
// the headshell was once pinned by hand and then left behind when the tube's
// tilt changed, which put it 0.04 short of the tube's end and 0.03 below it and
// left the cartridge visibly floating free of the arm.
//
// The tilt is 0.018 rather than the 0.04 it carried when the tube was 1.24
// long. Over a tube this length 0.04 would lift the headshell end 89 mm, which
// is a visible ramp rather than a tonearm.
//
// The arm was proportionally short: 181 mm pivot-to-spindle against an RB220's
// 222 mm. It is full size now. Rega publish 239 mm effective length and 222 mm
// pivot-to-spindle, which implies 17 mm of overhang -- and the tube length below
// is solved from the 239 mm, so the overhang falling out at exactly 17 mm is an
// independent check that the whole chain is consistent rather than a number
// anyone typed in.
const ARM_EFFECTIVE = 2.39      // 239 mm, pivot -> stylus
const ARM_P2S       = 2.22      // 222 mm, pivot -> spindle

// Pivot keeps the heading it always had from the spindle, pushed out to 222 mm.
const PIVOT_HEADING = Math.atan2(-0.55, 1.72)
const PIVOT_X = Math.cos(PIVOT_HEADING) * ARM_P2S
const PIVOT_Z = Math.sin(PIVOT_HEADING) * ARM_P2S

const TUBE_LEN   = 2.2244       // solved so the stylus lands at ARM_EFFECTIVE
const TUBE_TILT  = 0.018        // rad; the tube rises slightly toward the headshell
const TUBE_CX    = -TUBE_LEN / 2
const TUBE_CY    = 0.005
const TUBE_END_X = TUBE_CX - (TUBE_LEN / 2) * Math.cos(TUBE_TILT)   // -2.2243
const TUBE_END_Y = TUBE_CY + (TUBE_LEN / 2) * Math.sin(TUBE_TILT)

const HEADSHELL_YAW = -0.38     // ~22°, so the cartridge runs tangent to the groove
// Stylus within the headshell group. The cartridge body occupies local
// x -0.1575..-0.0625 and y -0.041..-0.011, so this puts the tip 2.0 mm forward
// of its front face and 1.6 mm below its underside -- roughly where a real MM
// cartridge sits. It used to be 1.05 mm forward and 2.7 mm down, a 69 degree
// cantilever, which is far steeper than any cartridge is built.
const STYLUS_LX     = -0.1775
const STYLUS_LY     = -0.057

// Stylus in pivot-local space. R_y(θ) on (x, 0, 0) gives (x·cosθ, 0, -x·sinθ).
const STYLUS_X = TUBE_END_X + STYLUS_LX * Math.cos(HEADSHELL_YAW)
const STYLUS_Z = -STYLUS_LX * Math.sin(HEADSHELL_YAW)

// How far the stylus hangs below the pivot, and how far out it reaches. Both
// were hardcoded (0.068 and 1.368) against a headshell position that no longer
// exists.
const STYLUS_DROP  = -(TUBE_END_Y + STYLUS_LY)
const ARM_REACH    = Math.hypot(STYLUS_X, STYLUS_Z)
const PIVOT_BASE_Y = RECORD_TOP + STYLUS_DROP

// Cueing rotates the arm about its bearing rather than translating the whole
// pivot upward. Raising the pivot lifted the arm clear of the bearing post it
// is supposed to be mounted on, which is what made it look like it was floating
// free of the deck. Rotating keeps the bearing fixed, and the counterweight
// dips as the stylus rises -- the see-saw a real arm actually does.
const LIFT_ANGLE = -Math.asin(RAISE_HEIGHT / ARM_REACH)   // negative lifts the -X end

// Arm state machine
const ARM = { PARKED: 0, SWINGING: 1, DROPPING: 2, PLAYING: 3 }

// The platter is NOT centred on the plinth -- on a Rega the spindle sits left
// of centre with the arm occupying the space to its right. Modelling it
// dead-centre left a large empty black expanse on the left of the deck.
const PLINTH_W        = 4.47   // 447 mm
const PLINTH_T        = 0.22   // deck slab, feet excluded
const PLINTH_D        = 3.60   // 360 mm
// Spindle 160 mm from the left edge of a 447 mm deck, as on a real Planar 2.
// This used to split the difference at 0.12, because a short arm plus the real
// offset crowded the bearing against the right edge. With a full-length arm the
// bearing clears the right edge by 76 mm, so the deck can sit where it belongs.
const PLINTH_OFFSET_X = -1.60 + PLINTH_W / 2   // 0.635

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

// Discogs art is frequently a photograph or scan of the sleeve with dead space
// around it, so a plain cover-fit crop still leaves the artwork as a square
// floating in a border. Find the real content instead.
//
// This used to take the bounding box of every pixel differing from the corner
// pixel, and that is defeated by anything PRINTED in the margin -- a barcode, a
// catalogue number, a "COLLECTOR'S EDITION" banner. A handful of dark glyphs
// out at the edge drag the box straight back to the full frame, and the border
// survives onto the label with the artwork's straight edges showing across it.
// That is exactly what a Toto IV scan did here.
//
// So score whole rows and columns by how much of each differs from the
// background, and keep the ones carrying real content. A band of artwork covers
// most of its row; a line of text covers a few percent of it. The cut is taken
// relative to the strongest row rather than at a fixed number, so it adapts to
// art that is mostly flat colour.
function contentBounds(img, threshold = 26) {
  const N = 64
  const cv = document.createElement('canvas')
  cv.width = cv.height = N
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, N, N)
  const d = ctx.getImageData(0, 0, N, N).data
  const at = (i, j) => { const o = (j * N + i) * 4; return [d[o], d[o + 1], d[o + 2]] }

  // Median of the four corners, so one dark speck in a corner cannot define the
  // background for the whole image.
  const corners = [at(0, 0), at(N - 1, 0), at(0, N - 1), at(N - 1, N - 1)]
  const bg = [0, 1, 2].map((c) => corners.map((p) => p[c]).sort((a, b) => a - b)[1])
  const differs = (i, j) => {
    const p = at(i, j)
    return Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > threshold
  }

  const rows = new Array(N).fill(0)
  const cols = new Array(N).fill(0)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      if (differs(i, j)) { rows[j]++; cols[i]++ }
    }
  }

  // Keep a line only if it carries at least 45% of the busiest line's content,
  // and at least a fifth of its own length. Sparse marginal printing clears
  // neither; a band of artwork clears both.
  const span = (counts) => {
    const peak = Math.max(...counts)
    if (peak === 0) return null
    const cut = Math.max(peak * 0.45, N * 0.2)
    let a = counts.findIndex((v) => v >= cut)
    let b = counts.length - 1 - [...counts].reverse().findIndex((v) => v >= cut)
    return a < 0 || b < a ? null : [a, b]
  }
  const xs = span(cols)
  const ys = span(rows)

  // Fall back to the whole frame when the trim finds nothing, or when it wants
  // to throw away so much that it has clearly locked onto a detail rather than
  // the artwork.
  const full = { sx: 0, sy: 0, sw: img.width, sh: img.height }
  if (!xs || !ys) return full
  const keep = ((xs[1] - xs[0] + 1) / N) * ((ys[1] - ys[0] + 1) / N)
  if (keep < 0.25) return full

  const kx = img.width / N
  const ky = img.height / N
  return { sx: xs[0] * kx, sy: ys[0] * ky, sw: (xs[1] - xs[0] + 1) * kx, sh: (ys[1] - ys[0] + 1) * ky }
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
      // Trim the sleeve's dead space, then take the CENTRE of what is left and
      // cover-fit that. Cover-fit alone always fills the circle, so nothing here
      // ever letterboxes -- but it fills it with the whole sleeve, edges and all,
      // and sleeve edges are where the junk lives. Mobile Fidelity prints
      // "ORIGINAL MASTER RECORDING" in a band across the top and a pressing
      // credit across the bottom; plenty of Discogs entries are a photograph of
      // the sleeve lying at an angle on a white table, whose dead space sits in
      // rotated corners that no axis-aligned trim can reach. Both land on the
      // label as straight edges cutting across the artwork.
      //
      // Zooming past the border sidesteps the whole class, and it is also just
      // what a label looks like: a real one is a 100 mm paper disc carrying a
      // small central design, not a shrunk-down album sleeve.
      const ZOOM = 0.72
      const b = contentBounds(img)
      const sw = b.sw * ZOOM
      const sh = b.sh * ZOOM
      const sx = b.sx + (b.sw - sw) / 2
      const sy = b.sy + (b.sh - sh) / 2
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
    <group ref={groupRef} position={[0, RECORD_CY, 0]}>
      {/* material order matches cylinderGeometry's groups: side, top, bottom */}
      <mesh name="Vinyl_Disc" castShadow receiveShadow material={[rimMat, faceMat, faceMat]}>
        <cylinderGeometry args={[RECORD_R, RECORD_R, RECORD_T, 256]} />
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
    <group ref={groupRef} position={[PIVOT_X, PIVOT_BASE_Y, PIVOT_Z]} rotation={[0, TONEARM_PLAY, LIFT_ANGLE]}>

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
      <mesh position={[TUBE_CX, TUBE_CY, 0]} rotation={[0, 0, Math.PI / 2 - TUBE_TILT]} castShadow>
        <cylinderGeometry args={[0.0165, 0.021, TUBE_LEN, 24]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.26} envMapIntensity={0.9} />
      </mesh>

      {/* ── Rear stub (counterweight arm) ── */}
      {/* Reaches 0.74 now rather than 0.50. The counterweight has to sit
          further back to look like it could balance a 239 mm arm, and the stub
          has to reach it -- at 0.46 it ended 0.0075 inside the counterweight,
          joined but by less than the render can resolve. */}
      <mesh position={[0.37, 0.003, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.017, 0.019, 0.74, 20]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.28} envMapIntensity={0.9} />
      </mesh>

      {/* ── Counterweight -- Rega grey/silver cylinder ── */}
      {/* BLACK. An RB220's counterweight is a black cylinder, not the silver
          slug this had -- checked against the owner's own photographs of the
          deck. It was lightened earlier purely to give the arm a silhouette
          against the dark plinth, which fixed the legibility and broke the
          likeness. The separation now comes from a satin finish catching the
          rim light instead of from the wrong colour. */}
      <mesh position={[0.68, 0, 0]} castShadow>
        <cylinderGeometry args={[0.062, 0.062, 0.095, 32]} />
        <meshStandardMaterial color="#232326" metalness={0.55} roughness={0.30} envMapIntensity={1.0} />
      </mesh>
      {/* End cap, a shade lighter so the cylinder reads as an end rather than a
          silhouette running off into the dark. */}
      <mesh position={[0.7255, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0635, 0.0635, 0.008, 32]} />
        <meshStandardMaterial color="#34343a" metalness={0.6} roughness={0.24} envMapIntensity={1.1} />
      </mesh>

      {/* ── Headshell, mounted ON the end of the tube ── */}
      <group position={[TUBE_END_X, TUBE_END_Y, 0]} rotation={[0, HEADSHELL_YAW, 0]}>

        {/* The connector runs BACK past the group origin, so it overlaps the
            tube's end cap instead of butting against it. An RB220's headshell
            is integral with the tube, and a joint that merely touches shows a
            seam from every angle -- which is what made the cartridge look like
            a separate object floating under the arm. */}
        <mesh position={[-0.028, -0.009, 0]} rotation={[0, 0, TUBE_TILT]}>
          <boxGeometry args={[0.15, 0.020, 0.038]} />
          <meshStandardMaterial color="#1c1c20" metalness={0.78} roughness={0.30} envMapIntensity={0.9} />
        </mesh>

        {/* Cartridge body. The 0.10 roll it used to carry was a 5.7 degree
            azimuth error -- a cartridge sits square to the record, and azimuth
            is the one alignment you set to zero. */}
        <mesh position={[-0.11, -0.026, 0]}>
          <boxGeometry args={[0.095, 0.030, 0.052]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.45} />
        </mesh>

        {/* Cantilever, running from INSIDE the cartridge body down to the stylus.
            Three separate faults, each only visible zoomed in -- which is
            exactly how a cartridge gets looked at:

            It was rotated [0.5, 0, 0.05]. An X rotation swings a +Y cylinder
            through Z, so it pointed sideways across the record rather than
            forward and down at the tip, and at 0.055 long against a 0.029 gap
            it shot through the stylus and out the far side.

            Aiming it then got the SIGN wrong. A cylinder's axis is +Y and
            R_z(p)·(0,1,0) = (-sin p, cos p), so aligning it with a direction u
            needs p = atan2(-ux, uy) -- not atan2(-ux, -uy), which mirrors it
            in Y. The result leaned back up toward the arm instead of down at
            the stylus, and a bounding-box check passes that happily because a
            mirrored cylinder still overlaps the cartridge's box.

            And it was invisible. 0.0018 radius is 0.18 mm, under a pixel at
            the size this renders, and #aaaaaa at metalness 0.9 is a mirror --
            in a scene this dark a mirror reflects nothing and comes out black.
            The one part joining cartridge to stylus rendered as nothing, so
            the stylus read as a dot floating underneath.

            Anchored 0.0096 INSIDE the body now rather than 0.0008, so it seats
            visibly instead of merely touching, and it overshoots the tip by
            0.0027 where the stylus sphere hides it. radiusTop is the +Y end,
            which is the stylus end, so that is the thinner of the two. */}
        <mesh position={[-0.1638, -0.0452, 0]} rotation={[0, 0, 2.2779]}>
          <cylinderGeometry args={[0.0024, 0.0035, 0.0416, 10]} />
          <meshStandardMaterial color="#c9ced4" metalness={0.55} roughness={0.28} envMapIntensity={1.4} />
        </mesh>

        {/* Stylus tip. Driven by the same constants the arm's reach and pivot
            height are solved from, so the geometry and the maths cannot drift
            apart again. */}
        <mesh position={[STYLUS_LX, STYLUS_LY, 0]}>
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
      <mesh position={[PLINTH_OFFSET_X, -PLINTH_T / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[PLINTH_W, PLINTH_T, PLINTH_D]} />
        {/* Piano black, but NOT a mirror: at roughness 0.10 the plinth reflected
            the softbox as a hard white slab with a visible straight edge. The
            rougher clearcoat blurs that into a soft sheen. */}
        <meshPhysicalMaterial color="#121215" roughness={0.34} metalness={0.0} reflectivity={0.45} clearcoat={1.0} clearcoatRoughness={0.26} envMapIntensity={0.55} />
      </mesh>

      {/* Feet. Four of them, inset from the corners like the real deck's. They
          are barely visible from a normal orbit, and that is not the point: they
          lift the plinth off the contact shadow so it reads as an object sitting
          on a surface rather than a rectangle printed on the backdrop. */}
      {[[-1.85, -1.42], [1.85, -1.42], [-1.85, 1.42], [1.85, 1.42]].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x + PLINTH_OFFSET_X, -PLINTH_T - 0.041, z]} castShadow>
          <cylinderGeometry args={[0.115, 0.13, 0.09, 24]} />
          <meshStandardMaterial color="#0b0b0d" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}

      {/* Glass platter -- Rega's teal-tinted glass. transmission needs a separate
          render pass per frame and the platter is almost entirely hidden under
          the record, so this approximates it with a cheap tinted dielectric. */}
      <mesh position={[0, GLASS_CY, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[GLASS_R, GLASS_R, GLASS_T, 128]} />
        {/* Sampled off the owner's own photograph rather than guessed. The
            bare platter in RegaP2_CreekCD43MK2_LuxmanK202_v2.jpg reads
            #a6ae98 and #abb597 along the exposed edge -- a pale sage, because
            Optiwhite is low-iron glass and light pipes along the rim.

            Both previous values were wrong in opposite directions: #2f6f68 was
            a saturated teal that made the rim the brightest thing in frame, and
            correcting it to #224a46 went dark enough to read as painted metal.
            Neither was ever checked against the real deck. */}
        <meshPhysicalMaterial
          color="#93a285"
          roughness={0.12}
          metalness={0.0}
          ior={1.52}
          clearcoat={1.0}
          clearcoatRoughness={0.10}
          envMapIntensity={0.55}
        />
      </mesh>

      {/* Felt mat -- Rega dark charcoal felt, sits on glass platter */}
      <mesh position={[0, MAT_CY, 0]} receiveShadow>
        <cylinderGeometry args={[MAT_R, MAT_R, MAT_T, 128]} />
        <meshStandardMaterial color="#252525" roughness={0.97} metalness={0.0} />
      </mesh>

      {/* Spindle. Was 0.016 radius in #aaaaaa, which against a bright label read
          as a speck of dirt rather than a machined pin -- and the centre of the
          record is exactly where the eye goes. Slightly wider, brighter and
          smoother so it reads as chrome. */}
      <mesh position={[0, RECORD_TOP - 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.021, 0.022, 0.16, 24]} />
        <meshStandardMaterial color="#d2d4d8" metalness={0.95} roughness={0.12} envMapIntensity={1.1} />
      </mesh>
      {/* Domed top, so it catches a highlight instead of showing a flat disc */}
      <mesh position={[0, RECORD_TOP + 0.02, 0]}>
        <sphereGeometry args={[0.021, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dcdee2" metalness={0.95} roughness={0.10} envMapIntensity={1.2} />
      </mesh>

      {/* Tonearm bearing post. It was 0.34 tall (top at y=0.34) while the pivot
          sits at y=0.110, so the pillar speared up past the arm and the two read
          as unrelated objects. It now terminates just inside the bearing
          housing, which straddles y=0.08..0.14. */}
      <mesh position={[PIVOT_X, (PIVOT_BASE_Y + 0.02) / 2, PIVOT_Z]} castShadow>
        <cylinderGeometry args={[0.062, 0.075, PIVOT_BASE_Y + 0.02, 24]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.8} roughness={0.28} envMapIntensity={0.9} />
      </mesh>
      {/* Base collar where the post meets the deck. Without it the post grew
          straight out of the plinth with no join, which is the detail that most
          made the arm look dropped in rather than mounted. */}
      <mesh position={[PIVOT_X, 0.008, PIVOT_Z]} castShadow>
        <cylinderGeometry args={[0.115, 0.125, 0.016, 28]} />
        <meshStandardMaterial color="#191919" metalness={0.7} roughness={0.35} envMapIntensity={0.8} />
      </mesh>

      <ArmRest />
      <CueLever />
      <AntiSkate />

      <Tonearm isPlaying={isPlaying} />
    </group>
  )
}

// ─── Arm rest ─────────────────────────────────────────────────────────────────
// The arm had nothing to park on: at rest it hung in mid-air over the deck.
//
// Placement is solved, not eyeballed. The cradle sits under the point 82% of
// the way along the tube, with the arm in the state it is actually parked in --
// swung to TONEARM_REST and raised by LIFT_ANGLE -- so the yoke meets the tube's
// underside rather than intersecting it or leaving a gap. It also has to clear
// the record, which is what forced TONEARM_REST outward in the first place.
const REST_T   = 0.82
const REST_LX  = STYLUS_X * REST_T
const REST_LY  = TUBE_CY + (Math.abs(REST_LX) / TUBE_LEN) * (TUBE_END_Y - TUBE_CY)
// the parked arm is cued UP, so rotate the contact point by the lift before use
const REST_RX  = REST_LX * Math.cos(LIFT_ANGLE) - REST_LY * Math.sin(LIFT_ANGLE)
const REST_RY  = REST_LX * Math.sin(LIFT_ANGLE) + REST_LY * Math.cos(LIFT_ANGLE)
const REST_X   = PIVOT_X + REST_RX * Math.cos(TONEARM_REST)
const REST_Z   = PIVOT_Z - REST_RX * Math.sin(TONEARM_REST)
const REST_TOP = PIVOT_BASE_Y + REST_RY - 0.0165    // underside of the tube

function ArmRest() {
  const post = REST_TOP - 0.022
  return (
    // Yawed with the parked arm so the yoke opens across the tube, not along it
    <group position={[REST_X, 0, REST_Z]} rotation={[0, TONEARM_REST, 0]}>
      <mesh position={[0, post / 2, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.034, post, 20]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.75} roughness={0.32} envMapIntensity={0.85} />
      </mesh>
      {/* Yoke floor */}
      <mesh position={[0, post + 0.011, 0]} castShadow>
        <boxGeometry args={[0.075, 0.022, 0.10]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.7} roughness={0.36} envMapIntensity={0.85} />
      </mesh>
      {/* Two uprights, one either side of the tube, forming the U it drops into */}
      {[-0.042, 0.042].map((z) => (
        <mesh key={z} position={[0, post + 0.034, z]} castShadow>
          <boxGeometry args={[0.070, 0.032, 0.016]} />
          <meshStandardMaterial color="#232326" metalness={0.6} roughness={0.34} envMapIntensity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Cue lever ────────────────────────────────────────────────────────────────
// The deck raises and lowers the arm on click, so the control that does it in
// real life should be visible. On a Planar 2 it is a black paddle on the arm
// base, forward of the bearing -- toward the camera here.
function CueLever() {
  const fx = PIVOT_X - 0.055
  const fz = PIVOT_Z + 0.185
  return (
    <group position={[fx, 0, fz]}>
      {/* Pillar the lever pivots on */}
      <mesh position={[0, 0.055, 0]} castShadow>
        <cylinderGeometry args={[0.030, 0.036, 0.11, 18]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.72} roughness={0.34} envMapIntensity={0.85} />
      </mesh>
      {/* Paddle, angled down as it is when the arm is lowered */}
      <mesh position={[-0.052, 0.118, 0.028]} rotation={[0, 0.42, -0.20]} castShadow>
        <boxGeometry args={[0.135, 0.016, 0.030]} />
        <meshStandardMaterial color="#232326" metalness={0.5} roughness={0.42} envMapIntensity={0.9} />
      </mesh>
      {/* Fingertip knob on the end */}
      <mesh position={[-0.112, 0.104, 0.052]} castShadow>
        <sphereGeometry args={[0.021, 16, 12]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.45} roughness={0.40} envMapIntensity={0.95} />
      </mesh>
    </group>
  )
}

// ─── Anti-skate ───────────────────────────────────────────────────────────────
// On an RB220 this is a small numbered dial on the arm base, behind the
// bearing. Static: it sets a bias force, it does not move with the arm.
function AntiSkate() {
  return (
    <group position={[PIVOT_X + 0.128, 0, PIVOT_Z - 0.108]}>
      <mesh position={[0, 0.048, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.096, 16]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.72} roughness={0.34} envMapIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0.104, 0]} castShadow>
        <cylinderGeometry args={[0.040, 0.040, 0.020, 24]} />
        <meshStandardMaterial color="#26262b" metalness={0.55} roughness={0.38} envMapIntensity={0.95} />
      </mesh>
      {/* Index mark, so the dial reads as a dial rather than a plain puck */}
      <mesh position={[0.026, 0.115, 0]}>
        <boxGeometry args={[0.022, 0.002, 0.005]} />
        <meshStandardMaterial color="#8d9096" metalness={0.4} roughness={0.5} envMapIntensity={1.1} />
      </mesh>
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
const FIT_MARGIN = 1.07

/**
 * View elevation, chosen from the viewport shape.
 *
 * Elevation does NOT change the horizontal extent of a deck this shape -- that
 * stays at its width whatever angle you look from, so on a narrow viewport the
 * distance is pinned by the width regardless. What elevation changes is how
 * much of the frame the deck OCCUPIES: seen from low down it foreshortens into
 * a thin band and a tall phone frame is mostly empty above and below it, while
 * from higher up it projects close to its full depth and fills that space.
 *
 * So: 38 degrees on a wide window, where the deck reads as an object on a
 * surface and the platter still shows as a circle; up to 62 on a tall one,
 * where the alternative is a sliver adrift in a column of black.
 */
const ELEV_WIDE = THREE.MathUtils.degToRad(38)
const ELEV_TALL = THREE.MathUtils.degToRad(62)

function viewDirForAspect(aspect) {
  // 1.6 and wider gets the low angle; 0.7 and narrower gets the high one.
  const k = THREE.MathUtils.clamp((1.6 - aspect) / (1.6 - 0.7), 0, 1)
  const elev = THREE.MathUtils.lerp(ELEV_WIDE, ELEV_TALL, k)
  return new THREE.Vector3(0, Math.sin(elev), Math.cos(elev))
}

// Bounds relative to the look-at target, taken from the geometry above rather
// than eyeballed: half the deck in X and Z, and in Y from the underside of the
// feet to the top of the counterweight.
const HALF_X = PLINTH_W / 2
const HALF_Z = PLINTH_D / 2
const MIN_Y = -(PLINTH_T + 0.09)
// Tall enough for the arm at full cue lift, plus the rest post it parks on --
// PIVOT_BASE_Y + 0.08 only covered the arm lying down.
const MAX_Y = PIVOT_BASE_Y + RAISE_HEIGHT + 0.07

function FitCamera() {
  const { camera, size, controls } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    const dir = viewDirForAspect(aspect)
    const target = new THREE.Vector3(PLINTH_OFFSET_X, 0, 0)
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize()
    const up = new THREE.Vector3().crossVectors(dir, right).normalize()

    const vFov = THREE.MathUtils.degToRad(camera.fov)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
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
          const along = c.dot(dir)
          dist = Math.max(
            dist,
            Math.abs(c.dot(up)) / tanV + along,
            Math.abs(c.dot(right)) / tanH + along,
          )
        }
      }
    }
    dist *= FIT_MARGIN

    camera.position.copy(dir).multiplyScalar(dist).add(target)
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
        {/* A long, NARROW overhead strip running front-to-back. The deck had
            only the small ceiling panel to mirror, which spread into a single
            featureless gradient across its whole top face. A strip gives that
            face a defined highlight to run along, which is what makes a
            piano-black surface read as lacquer rather than paint. Narrow on
            purpose -- widening it recreates the hard white slab the ceiling
            panel note above warns about, and at 2.6 directly over the spindle
            it washed the record: the vinyl's blacks lifted to grey and the
            radial specular sweep -- the thing that makes it read as a record at
            all -- went soft. Pushed out over the deck's right side and dimmed,
            so it lights the lacquer and leaves the disc alone. */}
        <Lightformer form="rect" intensity={1.55} color="#eaf2ff"
          position={[2.75, 5, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={[0.5, 5.5, 1]} />

        {/* Low warm bounce, lifts the plinth face out of pure black */}
        <Lightformer form="rect" intensity={0.7} color="#ffd9b0"
          position={[0, -1.5, 5]} rotation={[Math.PI / 2, 0, 0]} scale={[7, 3, 1]} />
      </Environment>

      {/* Single shadow-casting key. The scene previously had shadows enabled on
          the Canvas but castShadow={false} on every light, so nothing grounded
          the deck and it appeared to float. */}
      {/* Key. Warmed and lifted from 2.2/#fff6ec: the deck was reading as one
          flat grey gradient with no discernible light direction, which is what
          made a glossy black box look like a matte cut-out. A warm key played
          against the cool rims below gives the top surface somewhere to travel
          from and to. */}
      <directionalLight
        position={[4.5, 7, 3.5]}
        intensity={3.1}
        color="#fff1dd"
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
      {/* Cool counter-fill from the shadow side, non-shadowing. Without it the
          left of the deck fell to the same value as the backdrop and the object
          lost its near edge entirely. Kept low: this is separation, not
          illumination, and anything brighter flattens the key back out. */}
      <directionalLight position={[-5.5, 2.6, -1.5]} intensity={1.05} color="#9db9ff" />

      {/* Gentle ambient floor so shadow interiors are not crushed to pure black */}
      <ambientLight intensity={0.16} color="#aab8d0" />

      <VinylRecord coverUrl={release?.cover_image} />
      <Plinth isPlaying={isPlaying} />

      {/* Soft occlusion beneath the plinth -- grounds the deck in the scene.
          Dropped from -0.161 to sit under the FEET rather than through them.
          The plinth body now spans y -0.19..0 and the feet reach -0.28, so the
          old plane cut through both and the deck appeared to sink into its own
          shadow instead of standing on it. */}
      <ContactShadows
        position={[0, -(PLINTH_T + 0.092), 0]}
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
        <div className="flex items-center gap-2">
          {/* isPlaying was useState(true) with setIsPlaying never called, so the
              deck could not be stopped: the arm never reached ARM.PARKED and
              TONEARM_REST was unreachable. That made the arm rest decorative --
              a cradle the arm could never be put down in. Cueing it is also the
              thing the cue lever on the deck represents. */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Cue the arm up and stop the platter' : 'Lower the arm and start the platter'}
            className="flex items-center gap-1.5 font-mono-data text-xs px-3 py-2 rounded-lg border-subtle transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <span aria-hidden="true" className="material-symbols-rounded text-sm">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            {isPlaying ? 'CUE UP' : 'CUE DOWN'}
          </button>
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
              // 1.0 left the whole frame in the bottom third of the range.
              // 1.18 was too far the other way -- the label is a saturated red
              // and started to posterise. 1.09 lifts the deck without touching
              // the label.
              toneMappingExposure: 1.09,
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
