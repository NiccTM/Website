/**
 * Cross-checks the hand-written data files that the home page and the
 * /projects skill filter depend on. None of these fail loudly at runtime: a
 * stale project id in skills.js just drops a card from a filter, and a
 * mistyped route in featured.js is a link to the 404 page. Checking them here
 * keeps a rename in config.js or App.jsx from silently breaking either.
 *
 *   node --test tests/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects, hardwareDiagnostics } from '../src/data/config.js'
import { SKILLS, PROJECT_SKILLS, ELSEWHERE } from '../src/data/skills.js'
import { FEATURED } from '../src/data/featured.js'
import { thumbSrc } from '../src/utils/thumbs.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const projectIds = new Set(projects.map((p) => p.id))
const skillIds = new Set(SKILLS.map((s) => s.id))

/* Static route table, read from App.jsx so the test cannot drift from it. The
   redirect routes are excluded: a link should point at a real page. */
const appSrc = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8')
const ROUTES = new Set(['/'])
for (const m of appSrc.matchAll(/<Route\s+path="([^"*]+)"\s+element=\{<(?!Navigate)/g)) ROUTES.add('/' + m[1])

const pathOf = (to) => to.split('#')[0]
const isRoute = (to) => ROUTES.has(pathOf(to))

test('the route table was read from App.jsx', () => {
  for (const r of ['/', '/projects', '/hardware', '/hardware/reference']) assert.ok(ROUTES.has(r), `${r} not parsed`)
})

test('every PROJECT_SKILLS key is a real project id, and every skill id exists', () => {
  for (const [id, skills] of Object.entries(PROJECT_SKILLS)) {
    assert.ok(projectIds.has(id), `PROJECT_SKILLS has unknown project "${id}"`)
    for (const s of skills) assert.ok(skillIds.has(s), `project "${id}" uses unknown skill "${s}"`)
  }
})

test('every ELSEWHERE entry uses real skills and points at a real route', () => {
  for (const e of ELSEWHERE) {
    assert.ok(isRoute(e.to), `ELSEWHERE "${e.id}" links to unknown route ${e.to}`)
    for (const s of e.skills) assert.ok(skillIds.has(s), `ELSEWHERE "${e.id}" uses unknown skill "${s}"`)
  }
})

test('every FEATURED link is a real route and a hash names a real project', () => {
  for (const f of FEATURED) {
    assert.ok(isRoute(f.to), `FEATURED "${f.id}" links to unknown route ${f.to}`)
    const hash = f.to.split('#')[1]
    if (hash) {
      assert.match(hash, /^project-/, `FEATURED "${f.id}" hash ${hash}`)
      assert.ok(projectIds.has(hash.slice('project-'.length)), `FEATURED "${f.id}" hash names no project`)
    }
  }
})

test('every project caseStudy path is a real route', () => {
  const withCaseStudy = projects.filter((p) => p.caseStudy)
  assert.ok(withCaseStudy.length > 0, 'no project declares a caseStudy')
  for (const p of withCaseStudy) assert.ok(isRoute(p.caseStudy), `project "${p.id}" caseStudy ${p.caseStudy} is not a route`)
})

test('every FEATURED photograph exists under public/', () => {
  for (const f of FEATURED.filter((x) => x.media)) {
    const thumb = join(ROOT, 'public', decodeURI(thumbSrc(f.media.src)))
    assert.ok(existsSync(thumb), `missing ${thumb}`)
    assert.ok(f.media.alt && f.media.alt.length > 10, `"${f.id}" needs real alt text`)
  }
})

/* Every evidence mark on the motor pages has a note behind it, and the note
   agrees with the mark about what kind of evidence it is: a CALC mark must not
   open onto a NOM note. */
test('every motor evidence mark has a matching note', async () => {
  const { MOTOR_SPECS, MOTOR_REVISIONS } = await import('../src/data/bldcMotor.js')
  const { MOTOR_EVIDENCE } = await import('../src/data/bldcCaseStudy.js')
  const marks = [
    ...MOTOR_SPECS.filter((s) => s.evidence).map((s) => [s.note, s.evidence]),
    ...MOTOR_REVISIONS.map((r) => [r.note, r.evidence]),
  ]
  assert.ok(marks.length >= 4)
  for (const [note, kind] of marks) {
    assert.ok(MOTOR_EVIDENCE[note], `no MOTOR_EVIDENCE entry for "${note}"`)
    assert.equal(MOTOR_EVIDENCE[note].kind, kind, `"${note}" is marked ${kind} but its note says ${MOTOR_EVIDENCE[note].kind}`)
  }
  for (const [key, n] of Object.entries(MOTOR_EVIDENCE)) {
    assert.ok(['meas', 'calc', 'obs', 'nom'].includes(n.kind), `${key}: unknown kind ${n.kind}`)
    assert.ok(n.quantity && n.lines.length > 0, `${key}: empty note`)
  }
})

/* Motor facts settled against the team's final ENGR 320 presentation
   (docs/redesign/ENGINEERING-RECORD.md, "BLDC technical review"). The site
   once wrote the winding as "AaABbBCCC" in five places; the presentation, the
   winding table it cites, its pole sketch and the résumé all give AaABbBCcC.
   30 A is the ESC's rating, never a current the motor was shown to draw, and
   the bolts are structural steel. */
test('motor text uses the documented winding, steel bolts and no measured 30 A', () => {
  const files = ['src/data/config.js', 'src/data/bldcMotor.js', 'src/data/bldcCaseStudy.js', 'src/data/featured.js']
  const text = files.map((f) => readFileSync(join(ROOT, f), 'utf8').replace(/^\s*(\/\/|\/\*|\*).*$/gm, '')).join('\n')
  const windings = [...text.matchAll(/AaABbB[A-Za-z]{3}/g)].map((m) => m[0])
  assert.ok(windings.length >= 4, 'winding sequence not found')
  for (const w of windings) assert.equal(w, 'AaABbBCcC')
  assert.doesNotMatch(text, /iron[- ]bolt/i)
  assert.doesNotMatch(text, /30 ?A (needed|draw|current)|drew 30|needed for (the )?target torque/i)
})

/* Rover: details Nic has kept internal (the battery's identity, price and BMS
   settings, supplier names) must not reach the public text. The term list
   lives in docs/redesign/, which never ships to the public repository, so
   this check runs only where that file exists. */
const PRIVATE_TERMS = join(ROOT, 'docs/redesign/private-terms.txt')
/* Everything the NuPower write-up publishes. The private-term check above also
   reads these, and the shape checks below run everywhere, public repo included. */
const NUPOWER_FILES = ['src/data/nupowerCaseStudy.js', 'src/routes/NuPowerPage.jsx', 'src/components/diagrams/ProbeChain.jsx']

test('rover text keeps internal details private', { skip: !existsSync(PRIVATE_TERMS) && 'term list is kept outside the public repository' }, () => {
  const files = ['src/data/config.js', 'src/data/featured.js', 'src/routes/AboutPage.jsx', 'src/data/skills.js', ...NUPOWER_FILES]
  const text = files.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n').toLowerCase()
  const terms = readFileSync(PRIVATE_TERMS, 'utf8').split(/\r?\n/).map((t) => t.trim().toLowerCase()).filter((t) => t && !t.startsWith('#'))
  assert.ok(terms.length > 0, 'empty term list')
  for (const t of terms) assert.ok(!text.includes(t), 'an internal detail appears in the public text')
})

/* Rover status: the selected pack, the computing split and the telemetry list
   are not to be described as installed, tested or operating, and the AR2C
   sponsorship is not credited to the rover team. */
test('rover text claims no completed hardware', () => {
  const files = ['src/data/config.js', 'src/data/featured.js', 'src/routes/AboutPage.jsx']
  const text = files.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n')
  assert.doesNotMatch(text, /Sanmina[^.]*Rover|Rover[^.]*Sanmina/)
  const rover = readFileSync(join(ROOT, 'src/data/config.js'), 'utf8').split("id: 'rover-craft'")[1].split("id: 'ar2c-fpv'")[0]
  assert.match(rover, /not been installed or tested/)
  assert.doesNotMatch(rover, /passed (the |its )?safety|certified|is operational|telemetry is running|fully integrated/i)
})

/* Nic's role on the motor was Research & Presentation Lead (the presentation's
   contributions slide), not team lead, and the diagnosis and fixes were the
   team's. */
test('motor text gives the documented role and no personal diagnosis credit', () => {
  const files = ['src/data/config.js', 'src/data/bldcMotor.js', 'src/data/bldcCaseStudy.js', 'src/data/featured.js']
  const text = files.map((f) => readFileSync(join(ROOT, f), 'utf8').replace(/^\s*(\/\/|\/\*|\*).*$/gm, '')).join('\n')
  assert.match(text, /Research & Presentation Lead/)
  assert.doesNotMatch(text, /team lead|I led|I traced|I diagnosed|how I found/i)
})

/* The Hobbies service log (HardwareDiagnostics) shows each repair's reasoning
   in the open and merges consecutive photos that share a note into one entry.
   So every repair needs a note or a link to its own write-up, and photos that
   share a note must sit together, or the same note would print twice. They
   must share a caption as well, since the entry prints one work line. */
test('every logged repair carries a note or a write-up, and shared notes are adjacent', () => {
  const images = hardwareDiagnostics.categories.flatMap((c) => c.images)
  for (const img of images) {
    assert.ok(img.note || img.to, `${img.label} has neither a note nor a write-up`)
    if (img.to) assert.ok(ROUTES.has(img.to), `${img.label} links to ${img.to}, which is not a route`)
  }
  for (const c of hardwareDiagnostics.categories) {
    const seen = new Set()
    c.images.forEach((img, i) => {
      if (!img.note) return
      if (seen.has(img.note)) assert.equal(c.images[i - 1]?.note, img.note, `${img.label} repeats an earlier note but is not next to it`)
      // One entry prints one work line, so a shared job needs one caption.
      if (c.images[i - 1]?.note === img.note) assert.equal(img.caption, c.images[i - 1].caption, `${img.label} shares a note but not the caption`)
      seen.add(img.note)
    })
  }
})

/* UnBox figures come from the team's APSC 169 report: > 680 N in the full-scale
   crush test (p. 4) and > 60 kg stacked on an earlier, smaller PLA model
   (p. 30) are two different tests, not one figure in two units; 115 cycles is
   the life-cycle analysis's planning figure (p. 38), not a test result; and
   the report models end-of-life composting, not "100%" compostability. */
test('UnBox claims stay as the team report states them', () => {
  const unbox = projects.find((p) => p.id === 'unbox')
  const text = JSON.stringify(unbox)
  assert.doesNotMatch(text, /680 N \(>? ?60 kg\)/, '680 N and 60 kg are separate tests, not an equivalence')
  assert.doesNotMatch(text, /100% compostable/i)
  assert.match(text, /assumed in the life-cycle analysis, not tested/)
})

/* NuPower: nothing from the device or the workstation. The firmware dump, its
   hashes, radio addresses and local paths stay in the private research folder;
   these are the shapes they would take if one leaked into the public text. A
   private term list, if any, lives with the Rover one outside this repo. */
function nupowerText() {
  const entry = readFileSync(join(ROOT, 'src/data/config.js'), 'utf8').split("id: 'nupower-p100'")[1].split("id: 'algotraderos'")[0]
  return [entry, ...NUPOWER_FILES.map((f) => readFileSync(join(ROOT, f), 'utf8'))].join('\n')
}

test('the NuPower write-up carries no MAC address, 64-hex hash or Windows path', () => {
  const text = nupowerText()
  assert.ok(text.includes('Allwinner F133-B'), 'the NuPower entry was not found')
  assert.doesNotMatch(text, /\b[0-9a-f]{2}([:-])(?:[0-9a-f]{2}\1){4}[0-9a-f]{2}\b/i, 'a MAC-address pattern')
  assert.doesNotMatch(text, /(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])/i, 'a 64-hex-character hash')
  assert.doesNotMatch(text, /\b[a-z]:\\/i, 'a Windows path')
})

/* The records establish no cause: the PWM change and the failure are close in
   time, nothing more, and nothing says the panel is defective. The write-up
   must also keep saying plainly that the display does not work. */
test('the NuPower write-up names no cause and does not claim a fix', () => {
  const text = nupowerText()
  assert.doesNotMatch(text, /(panel|display|screen|LCD) (is|was) (defective|faulty|broken|dead|damaged)/i)
  assert.doesNotMatch(text, /(PWM|20 kHz|frequency) change (caused|broke|killed|damaged)/i)
  assert.doesNotMatch(text, /caused the (failure|blank|grey)/i)
  assert.match(text, /does not say what caused it/)
  assert.match(text, /display still does not work/i)
  assert.doesNotMatch(text, /no PMIC|PMIC is (not )?fitted|GINT0/i, 'inferred or unconfirmed details stay out')
})

/* The NuPower photographs ship to a public repository and site. They were
   re-encoded from pixels only; an EXIF or XMP block (camera, time, GPS) in any
   tier would undo that, so check every file the site serves and the original. */
test('the NuPower photographs carry no EXIF or XMP metadata', () => {
  const files = ['originals', 'public/thumbs', 'public/display'].flatMap((d) =>
    ['nupower-p100-opened', 'nupower-p100-board'].flatMap((n) => [`${d}/${n}.jpg`, `${d}/${n}.avif`]))
    .filter((f) => existsSync(join(ROOT, f)))
  assert.ok(files.length >= 6, `only ${files.length} NuPower photo files found`)
  for (const f of files) {
    const bytes = readFileSync(join(ROOT, f)).toString('latin1')
    assert.ok(!bytes.includes('Exif' + String.fromCharCode(0, 0)), `${f} carries an EXIF block`)
    assert.ok(!bytes.includes('http://ns.adobe.com/xap/'), `${f} carries XMP`)
  }
})

/* originals/ is never deployed, but it is committed to both repos, and the
   public one is world-readable. Phone and camera photos arrive with an EXIF
   GPS IFD and an XMP packet (Lightroom also copies the location into XMP), so
   a new original can leak where it was taken. Strip metadata losslessly before
   committing one; keep only the ICC profile and, where it is not 1, an
   Orientation-only EXIF block.

   Every "Exif\0\0" + TIFF header in the file is checked, not just the first
   APP1: Samsung shots append MPF secondary JPEGs after the main image's EOI,
   each with its own EXIF. A PNG eXIf chunk is raw TIFF with no prefix. */
const IMAGE_EXT = /\.(jpe?g|png|webp|tiff?|heic|avif|gif)$/i
const XMP_MARKERS = ['http://ns.adobe.com/xap/1.0/', '<x:xmpmeta']

function tiffHasGpsIfd(buf, at) {
  const le = buf.toString('latin1', at, at + 2) === 'II'
  if (!le && buf.toString('latin1', at, at + 2) !== 'MM') return false
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  if (at + 8 > buf.length || u16(at + 2) !== 42) return false
  const ifd = at + u32(at + 4)
  if (ifd + 2 > buf.length) return false
  const count = u16(ifd)
  for (let e = 0; e < count && ifd + 2 + e * 12 + 2 <= buf.length; e++) {
    if (u16(ifd + 2 + e * 12) === 0x8825) return true
  }
  return false
}

function metadataLeaks(buf) {
  const found = []
  if (XMP_MARKERS.some((m) => buf.includes(m, 0, 'latin1'))) found.push('XMP block')
  const exif = Buffer.from('Exif\0\0', 'latin1')
  for (let i = buf.indexOf(exif); i !== -1; i = buf.indexOf(exif, i + 1)) {
    if (tiffHasGpsIfd(buf, i + 6)) { found.push('EXIF GPS IFD'); break }
  }
  if (!found.includes('EXIF GPS IFD') && buf.readUInt32BE(0) === 0x89504e47) {
    for (let i = 8; i + 8 <= buf.length; ) {
      const len = buf.readUInt32BE(i)
      const type = buf.toString('latin1', i + 4, i + 8)
      if (type === 'eXIf' && tiffHasGpsIfd(buf, i + 8)) { found.push('EXIF GPS IFD'); break }
      if (type === 'IEND') break
      i += 12 + len
    }
  }
  return found
}

function exifJpeg(tag) {
  // SOI + APP1 Exif with a one-entry big-endian IFD0, + EOI.
  const tiff = Buffer.alloc(8 + 2 + 12 + 4)
  tiff.write('MM', 0, 'latin1'); tiff.writeUInt16BE(42, 2); tiff.writeUInt32BE(8, 4)
  tiff.writeUInt16BE(1, 8); tiff.writeUInt16BE(tag, 10); tiff.writeUInt16BE(4, 12); tiff.writeUInt32BE(1, 14)
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff])
  const len = Buffer.alloc(2); len.writeUInt16BE(payload.length + 2)
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), len, payload, Buffer.from([0xff, 0xd9])])
}

test('the originals metadata check catches GPS and XMP and passes Orientation', () => {
  assert.deepEqual(metadataLeaks(exifJpeg(0x8825)), ['EXIF GPS IFD'])
  assert.deepEqual(metadataLeaks(exifJpeg(0x0112)), [])
  const trailer = Buffer.concat([exifJpeg(0x0112), exifJpeg(0x8825)])
  assert.deepEqual(metadataLeaks(trailer), ['EXIF GPS IFD'], 'a GPS IFD in an appended MPF image counts')
  const xmp = Buffer.concat([exifJpeg(0x0112), Buffer.from('<x:xmpmeta xmlns:x="adobe:ns:meta/">', 'latin1')])
  assert.deepEqual(metadataLeaks(xmp), ['XMP block'])
})

const ORIGINALS = join(ROOT, 'originals')
test('no file under originals/ carries an EXIF GPS IFD or an XMP block', { skip: !existsSync(ORIGINALS) && 'originals/ is not in this checkout' }, () => {
  const dir = ORIGINALS
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && IMAGE_EXT.test(d.name))
    .map((d) => join(d.parentPath ?? d.path, d.name))
  assert.ok(files.length > 100, `only ${files.length} images found under originals/`)
  const leaks = []
  for (const f of files) {
    const found = metadataLeaks(readFileSync(f))
    if (found.length) leaks.push(`${f.slice(dir.length + 1)}: ${found.join(', ')}`)
  }
  assert.deepEqual(leaks, [], `strip metadata from:\n  ${leaks.join('\n  ')}`)
})
