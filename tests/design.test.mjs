/**
 * Guards the type half of docs/redesign/CASSETTE-DESIGN-CONTRACT.md. Font
 * mistakes on this site have always failed silently: a missing file falls
 * through to the next family, a preload that names the wrong file downloads a
 * font nothing uses, and a novelty face creeping back in looks fine to whoever
 * added it. These checks make each of those a test failure instead.
 *
 *   node --test tests/design.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => readFileSync(join(ROOT, f), 'utf8')
const css = read('src/styles/index.css')
const html = read('index.html')
const tw = read('tailwind.config.js')
const fontSrcs = [...css.matchAll(/@font-face\s*\{[^}]*?src:\s*url\('([^']+)'\)/g)].map((m) => m[1])

test('every @font-face file exists under public/', () => {
  assert.ok(fontSrcs.length >= 2, 'no @font-face rules parsed')
  for (const src of fontSrcs) assert.ok(existsSync(join(ROOT, 'public', src)), `missing ${src}`)
})

test('the preloaded font is one the stylesheet actually uses', () => {
  const preloads = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)].map((m) => m[1])
  assert.equal(preloads.length, 1, 'exactly one text face is preloaded')
  for (const p of preloads) assert.ok(fontSrcs.includes(p), `preload ${p} is not an @font-face src`)
})

test('every served font is licensed in public/fonts', () => {
  const licences = read('public/fonts/LICENSES.txt')
  for (const f of readdirSync(join(ROOT, 'public/fonts')).filter((n) => n.endsWith('.woff2'))) {
    assert.ok(licences.includes(f), `${f} is not named in LICENSES.txt`)
  }
  assert.ok(existsSync(join(ROOT, 'public/fonts/Archivo-OFL.txt')), 'the OFL text must travel with Archivo')
})

/* The faces that read as a premade retro or AI template (see the contract's
   prohibited list). Roboto may appear only as a system fallback name. */
test('no template typefaces in the stylesheet, Tailwind config or HTML', () => {
  const banned = /Exo 2|Orbitron|VT323|Share Tech|Press Start|Space Grotesk|Audiowide|['"]Inter['"]/
  for (const [name, text] of [['index.css', css.replace(/\/\*[\s\S]*?\*\//g, '')], ['tailwind.config.js', tw.replace(/\/\/.*$/gm, '')], ['index.html', html.replace(/<!--[\s\S]*?-->/g, '')]]) {
    assert.doesNotMatch(text, banned, `${name} names a prohibited typeface`)
  }
})

/* The legend width must sit inside the axis range the subset file keeps,
   or the browser clamps it without a word. */
test('legend width is inside the instanced wdth range', () => {
  const stretch = Number(css.match(/--legend-stretch:\s*([\d.]+)%/)?.[1])
  const [lo, hi] = (css.match(/font-family: 'Archivo';[\s\S]*?font-stretch:\s*(\d+)%\s+(\d+)%/) || []).slice(1).map(Number)
  assert.ok(lo && hi, 'Archivo @font-face has no font-stretch range')
  assert.ok(stretch >= lo && stretch <= hi, `--legend-stretch ${stretch}% outside ${lo}-${hi}%`)
})

/* Route headers (contract section 15): five routes, five different
   compositions. The recessed HeaderPlate belongs to /hobbies alone -- a second
   copy is how the shared template the headers replaced would come back. */
test('the header plate is used by exactly one route', () => {
  const routes = readdirSync(join(ROOT, 'src/routes')).filter((f) => f.endsWith('.jsx'))
  const users = routes.filter((f) => /<HeaderPlate\b/.test(read(`src/routes/${f}`)))
  assert.deepEqual(users, ['HobbiesPage.jsx'])
})

/* The colophon imprint prints a commit date. It must be labelled as one, not
   as an "updated" or "reviewed" date it is not. */
test('the colophon imprint labels its date as a commit date', () => {
  const colophon = read('src/routes/ColophonPage.jsx')
  const imprint = colophon.slice(colophon.indexOf('function Imprint'), colophon.indexOf('/* Side-column'))
  assert.match(imprint, /committed/)
  assert.doesNotMatch(imprint, /updated|reviewed|last modified/i)
})
