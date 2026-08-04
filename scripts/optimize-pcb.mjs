/*
 * One-shot offline optimiser: originals/PCB.gltf  ->  public/models/PCB.glb
 *
 * The raw export lives in originals/, not public/, for the same reason the
 * full-resolution photographs do: it is the source the committed artefact is
 * derived from, and it must not be deployed. It is 7.9 MB and nothing requests
 * it -- leaving it in public/ shipped it to every visitor's CDN edge for
 * nothing and left it publicly fetchable.
 *
 * This is NOT part of the build. It is run by hand when the board is
 * re-exported from Altium, and its output is committed. Run it with:
 *
 *   npm i --no-save @gltf-transform/core @gltf-transform/extensions \
 *                   @gltf-transform/functions meshoptimizer
 *   node scripts/optimize-pcb.mjs
 *
 * (One npm call, not several. --no-save installs are transient: a later
 * npm install prunes anything absent from package.json, including the packages
 * an earlier --no-save call just added.)
 *
 * WHAT WAS WRONG WITH THE EXPORT
 * ------------------------------
 * Open CASCADE 7.8 wrote a file that renders incorrectly and draws slowly, for
 * four separate reasons. Measured on the original, not guessed:
 *
 * 1. THE WHOLE MODEL IS IN THERE TWICE. The scene root has a "PCB" subtree
 *    holding the full assembly, and then a second, flat copy of every part
 *    beside it (Board, D1, D2, C1..C6, U1..U4, J1, J2, VR1, Free-Models) plus a
 *    third loose copy of the board. Comparing world matrices and index counts,
 *    73 of 73 drawables outside "PCB" are identical in geometry AND position to
 *    something inside it. Nothing is unique to the copy. So every surface was
 *    being rasterised twice at exactly the same depth, which is z-fighting by
 *    construction -- that is what the polygonOffset call in PCBViewer was
 *    fighting. 208,132 triangles drawn for 98,336 triangles of actual board.
 *
 * 2. EVERY MATERIAL IS FULLY METALLIC. Open CASCADE omitted metallicFactor and
 *    roughnessFactor on all 13 materials, and the glTF default for both is 1.0.
 *    A metal has no diffuse response, so with no environment map to reflect,
 *    every part rendered as a flat grey lump and threw its base colour away --
 *    the green substrate, the gold pads, the orange and red component bodies
 *    were all in the file and none of them reached the screen.
 *
 * 3. 68,328 PRIMITIVES. Each is its own draw call. One material alone (mat_2,
 *    the plated leads) accounted for 65,890 of them across 87,428 triangles --
 *    1.3 triangles per draw call. The GPU was idle; the CPU was issuing calls.
 *
 * 4. doubleSided ON EVERYTHING. These are closed solids, so backface culling is
 *    safe and halves the fragment work.
 *
 * The .gltf JSON was also 6.66 MB, because 68,328 primitives and 9,648
 * accessors need describing. Merging collapses that to a handful of each.
 *
 * WHAT THIS SCRIPT DOES
 * ---------------------
 * Drops the duplicate copies, assigns real metallic/roughness values, turns off
 * doubleSided, then welds, merges every primitive that shares a material into
 * one, and quantises. Result is one draw call per material.
 *
 * COMPRESSION, AND WHY IT IS NOT OPTIONAL HERE
 * --------------------------------------------
 * Merging is not free. The export reuses one mesh across every instance of the
 * same part -- twenty identical resistors are one accessor drawn at twenty
 * transforms -- and merging bakes each instance into its own vertices. It also
 * throws away the compressor's best meal: 68,328 nearly identical JSON objects
 * brotli down to almost nothing. Measured, uncompressed .gltf + .bin is 7.9 MB
 * but only 323 KB on the wire; a merged, quantised .glb is 3.2 MB raw and 884
 * KB on the wire. Merging alone would have made the download 2.7x WORSE while
 * making the frame 5000x cheaper.
 *
 * EXT_meshopt_compression pays that back. It is preferred over Draco because
 * its decoder ships inside three-stdlib, which drei already depends on, so it
 * is bundled rather than fetched -- drei's useGLTF defaults useMeshopt to true
 * and wires it automatically. Draco's decoder is fetched from gstatic.com by
 * default, which this site's CSP (connect-src 'self') blocks, so it would have
 * to be self-hosted to work at all. PCBViewer passes useDraco: false so no
 * DRACOLoader is ever constructed and nothing can reach for gstatic.
 *
 * This model is geometry-only: no textures, no UVs, no skins, no animation.
 *
 * Materials are renamed from mat_N to readable names. PCBViewer.jsx looks the
 * board and the LED lens up BY MATERIAL NAME, so if you rename them here you
 * must rename them there.
 */

import fs from 'node:fs'
import path from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions'
import { dedup, flatten, join, weld, prune, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'

const SRC = 'originals/PCB.gltf'
const DST = 'public/models/PCB.glb'

/* Open CASCADE exports colour only. Everything below is a judgement call about
   what each colour IS, made from the base colour plus how much of the board it
   covers, and then checked against a render. Neutral greys and the gold are
   plating and lead frames, so they are metal; anything with a hue is a plastic
   or ceramic body, so it is not. Getting this wrong is visible immediately --
   a dielectric reads as chalk, a metal with no environment reads as charcoal. */
const MATERIALS = {
  mat_0:  { name: 'board',          metallic: 0.0,  roughness: 0.55 }, // #297735 solder mask
  mat_1:  { name: 'plastic_dark',   metallic: 0.0,  roughness: 0.70 }, // #4a4a4a
  mat_2:  { name: 'lead_plating',   metallic: 0.85, roughness: 0.38 }, // #71787f, 87k tris of leads
  mat_3:  { name: 'led_lens',       metallic: 0.0,  roughness: 0.12 }, // #ffffff diffused lens
  mat_4:  { name: 'metal_light',    metallic: 0.90, roughness: 0.32 }, // #bfbfbf lead frame
  mat_5:  { name: 'pad_gold',       metallic: 1.0,  roughness: 0.28 }, // #d6d600 ENIG
  mat_6:  { name: 'body_orange',    metallic: 0.0,  roughness: 0.50 }, // #ffac06 film cap
  mat_7:  { name: 'metal_mid',      metallic: 0.80, roughness: 0.40 }, // #7f7f7f
  mat_8:  { name: 'copper',         metallic: 0.90, roughness: 0.35 }, // #be9068
  mat_9:  { name: 'plastic_black',  metallic: 0.0,  roughness: 0.65 }, // #363636 IC body
  mat_10: { name: 'metal_can',      metallic: 0.80, roughness: 0.42 }, // #7f7f7f
  mat_11: { name: 'body_yellow',    metallic: 0.0,  roughness: 0.50 }, // #ffff00
  mat_12: { name: 'body_red',       metallic: 0.0,  roughness: 0.60 }, // #cd6459 ceramic cap
}

await MeshoptEncoder.ready

const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read(SRC)
const root = doc.getRoot()

const countPrims = () => root.listMeshes().reduce((n, m) => n + m.listPrimitives().length, 0)
const countTris = () => {
  let t = 0
  for (const n of root.listNodes()) {
    const mesh = n.getMesh()
    if (!mesh) continue
    for (const p of mesh.listPrimitives()) {
      const idx = p.getIndices()
      t += (idx ? idx.getCount() : p.getAttribute('POSITION').getCount()) / 3
    }
  }
  return Math.round(t)
}

const before = { prims: countPrims(), tris: countTris(), bytes: fs.statSync(SRC).size + fs.statSync('originals/PCB.bin').size }

/* ── 1. Drop the duplicated copies ─────────────────────────────────────────
   Keep only the "PCB" subtree. The export wraps everything in one unnamed node
   under the scene, so the duplicates are siblings of "PCB" inside that wrapper
   rather than direct children of the scene. detach() unparents them; prune()
   below then removes the now-unreferenced meshes and accessors. */
const assembly = root.listNodes().filter((n) => n.getName() === 'PCB')
if (assembly.length !== 1) throw new Error(`expected exactly one node named "PCB", found ${assembly.length}`)
const wrapper = assembly[0].getParentNode() ?? root.listScenes()[0]
let dropped = 0
for (const child of wrapper.listChildren()) {
  if (child === assembly[0]) continue
  child.detach()
  dropped++
}
if (!dropped) throw new Error('found no duplicate siblings of "PCB" -- has the export changed?')
console.log(`dropped ${dropped} duplicate siblings of "PCB"`)

/* ── 2. Real PBR values, and cull backfaces ───────────────────────────────── */
for (const mat of root.listMaterials()) {
  const spec = MATERIALS[mat.getName()]
  if (!spec) throw new Error(`no PBR mapping for material "${mat.getName()}" -- add it to MATERIALS`)
  mat.setMetallicFactor(spec.metallic)
  mat.setRoughnessFactor(spec.roughness)
  mat.setDoubleSided(false)
  mat.setName(spec.name)
}
console.log(`assigned metallic/roughness to ${root.listMaterials().length} materials`)

/* ── 3. Collapse the geometry ──────────────────────────────────────────────
   flatten bakes the node transforms so meshes become mergeable at all; weld
   shares vertices between the many tiny tessellated patches; join merges every
   primitive sharing a material into one; prune drops what is now orphaned. */
await doc.transform(
  flatten(),
  dedup(),
  weld(),
  join({ keepNamed: false }),
  prune(),
  /* meshopt quantises as part of its own pipeline, so there is no separate
     quantize() step -- running both would quantise already-quantised data. */
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
)

fs.mkdirSync(path.dirname(DST), { recursive: true })
await io.write(DST, doc)

const after = { prims: countPrims(), tris: countTris(), bytes: fs.statSync(DST).size }
const kb = (b) => `${(b / 1024).toFixed(0)} KB`

console.log('')
console.log('                 before        after')
console.log(`draw calls  ${String(before.prims).padStart(10)}   ${String(after.prims).padStart(10)}`)
console.log(`triangles   ${String(before.tris).padStart(10)}   ${String(after.tris).padStart(10)}`)
console.log(`on disk     ${kb(before.bytes).padStart(10)}   ${kb(after.bytes).padStart(10)}`)
console.log('')
console.log('meshes and their materials (PCBViewer looks these up by name):')
for (const mesh of root.listMeshes()) {
  for (const p of mesh.listPrimitives()) {
    console.log(`  ${p.getMaterial().getName().padEnd(16)} ${String(p.getIndices().getCount() / 3).padStart(7)} tris`)
  }
}
