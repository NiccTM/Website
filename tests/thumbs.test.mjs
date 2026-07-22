/**
 * Locks in the thumbnail path helpers.
 *
 * The regression these guard against actually happened: thumbSrc rewrote every
 * path to /thumbs/, including /motor-cad.gif, for which no derivative is ever
 * generated — so the tile rendered as a broken image. The fix was to consult
 * the generator's own manifest, which is what the "leaves un-derived assets
 * alone" cases below assert.
 *
 *   node --test tests/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { thumbSrc, displaySrc, hasThumb } from '../src/utils/thumbs.js'

const manifest = JSON.parse(readFileSync(new URL('../src/data/photoDimensions.json', import.meta.url)))
const known = Object.keys(manifest)

test('manifest is populated and keyed by public URL path', () => {
  assert.ok(known.length > 50, `expected many entries, got ${known.length}`)
  assert.ok(known.every((k) => k.startsWith('/')))
})

test('rewrites a known image into the thumbs/ and display/ tiers', () => {
  const src = '/Remastered Photos/Northern Lights.jpg'
  assert.ok(hasThumb(src))
  assert.equal(thumbSrc(src), '/Remastered Photos/thumbs/Northern Lights.jpg')
  assert.equal(displaySrc(src), '/Remastered Photos/display/Northern Lights.jpg')
})

test('handles root-level images too', () => {
  const src = '/ASUS_laptop.jpg'
  assert.ok(hasThumb(src))
  assert.equal(thumbSrc(src), '/thumbs/ASUS_laptop.jpg')
  assert.equal(displaySrc(src), '/display/ASUS_laptop.jpg')
})

test('leaves assets with no generated derivative untouched', () => {
  // The generator only handles .jpg/.jpeg/.png. Rewriting anything else points
  // at a file that was never built — this is the motor-cad.gif regression.
  for (const src of ['/motor-cad.gif', '/PCB.gltf', '/videos/clip_cmp.mp4', '/nonexistent.jpg']) {
    assert.equal(hasThumb(src), false, `${src} should not be in the manifest`)
    assert.equal(thumbSrc(src), src, `${src} must be returned unchanged`)
    assert.equal(displaySrc(src), src, `${src} must be returned unchanged`)
  }
})

test('is safe against non-string input', () => {
  for (const bad of [undefined, null, 42, {}]) {
    assert.equal(hasThumb(bad), false)
    assert.equal(thumbSrc(bad), bad)
  }
})

test('every manifest entry round-trips to a distinct tier path', () => {
  for (const k of known.slice(0, 25)) {
    assert.notEqual(thumbSrc(k), k)
    assert.notEqual(displaySrc(k), k)
    assert.notEqual(thumbSrc(k), displaySrc(k))
  }
})
