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
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from '../src/data/config.js'
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
test('rover text keeps internal details private', { skip: !existsSync(PRIVATE_TERMS) && 'term list is kept outside the public repository' }, () => {
  const files = ['src/data/config.js', 'src/data/featured.js', 'src/routes/AboutPage.jsx', 'src/data/skills.js']
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
