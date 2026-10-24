import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Guards the prerendered output in dist/.
 *
 * The prerender is load-bearing and fails QUIETLY. If renderToPipeableStream
 * ever emits a Suspense fallback instead of the route -- which is exactly what
 * renderToString would do, since every route is behind lazy() -- the build
 * still succeeds and the shells still look right. The only symptom is that
 * crawlers see an empty page again, which nobody notices for weeks.
 *
 * scripts/prerender-meta.mjs already throws on a route under 200 characters,
 * but that guard lives inside the thing it is guarding. This checks the
 * artefact from outside, and covers the meta that has to stay in step with it.
 *
 * Skips rather than fails when dist/ is absent, so `npm test` works on a clean
 * checkout without forcing a build first.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

const ROUTES = [
  { file: 'index.html',             path: '/',                   title: 'Nic Piraino | Hardware Engineering & System Design' },
  { file: 'projects.html',          path: '/projects',           title: 'Nic Piraino | Projects' },
  { file: 'projects/bldc-motor.html', path: '/projects/bldc-motor', title: 'Nic Piraino | BLDC Motor Case Study' },
  { file: 'hardware.html',          path: '/hardware',          title: 'Nic Piraino | Hardware Lab' },
  { file: 'hardware/reference.html', path: '/hardware/reference', title: 'Nic Piraino | Voltage Reference' },
  { file: 'hobbies.html',           path: '/hobbies',            title: 'Nic Piraino | Hobbies' },
  { file: 'hobbies/cd-player.html', path: '/hobbies/cd-player',  title: 'Nic Piraino | CD Player Repair' },
  { file: 'about.html',             path: '/about',              title: 'Nic Piraino | About' },
  { file: 'colophon.html',          path: '/colophon',           title: 'Nic Piraino | Colophon' },
]

const built = existsSync(join(DIST, 'index.html'))
const opts = { skip: built ? false : 'dist/ not built -- run npm run build' }

const read = (f) => readFileSync(join(DIST, f), 'utf8')

/** Visible text a crawler would see: body, minus scripts and tags. */
function bodyText(html) {
  const body = html.match(/<body[\s\S]*<\/body>/)?.[0] ?? ''
  return body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

test('every route ships prerendered markup, not an empty root', opts, () => {
  for (const { file } of ROUTES) {
    const html = read(file)
    assert.ok(
      !html.includes('<div id="root"></div>'),
      `${file} still has an empty #root -- the prerender did not run`,
    )
    const text = bodyText(html)
    assert.ok(
      text.length > 500,
      `${file} has only ${text.length} chars of body text; a Suspense fallback probably escaped`,
    )
  }
})

test('each route carries its own title, canonical and og:url', opts, () => {
  for (const { file, path, title } of ROUTES) {
    const html = read(file)
    assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1], title, `${file} title`)
    const expected = `https://nicpiraino.com${path === '/' ? '/' : path}`
    assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1], expected, `${file} canonical`)
    assert.equal(html.match(/<meta property="og:url"\s+content="([^"]+)"/)?.[1], expected, `${file} og:url`)
  }
})

/* The shell's descriptions are written by String.replace, where "$1" or "$&"
   in the replacement is a pattern. A description containing "$100" once
   shipped as the captured tag prefix followed by "00". Compare every shell's
   three description tags with the usePageMeta source text, character for
   character. */
test('each shell description is its route source text, unmangled', opts, () => {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const sources = new Set()
  for (const f of ['HomePage', 'ProjectsPage', 'BLDCMotorPage', 'HardwarePage', 'ReferencePage', 'HobbiesPage', 'CDPlayerPage', 'AboutPage', 'ColophonPage']) {
    const p = join(ROOT, 'src/routes', `${f}.jsx`)
    if (!existsSync(p)) continue
    const m = readFileSync(p, 'utf8').match(/usePageMeta\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'((?:[^'\\]|\\.)*)'/)
    if (m) sources.add(esc(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')))
  }
  assert.ok(sources.size >= 5, `only ${sources.size} usePageMeta descriptions found in src/routes`)
  for (const { file } of ROUTES) {
    const html = read(file)
    const tags = [
      /<meta\s+name="description"\s+content="([^"]*)"/g,
      /<meta\s+property="og:description"\s+content="([^"]*)"/g,
      /<meta\s+name="twitter:description"\s+content="([^"]*)"/g,
    ].map((re) => [...html.matchAll(re)].map((m) => m[1]))
    for (const found of tags) assert.equal(found.length, 1, `${file}: expected one of each description tag`)
    // Home keeps index.html's own tags, where the search description is
    // deliberately prefixed with the name and the social ones are not.
    if (file === 'index.html') continue
    const [d, og, tw] = tags.map((t) => t[0])
    assert.equal(og, d, `${file}: og:description differs from description`)
    assert.equal(tw, d, `${file}: twitter:description differs from description`)
    assert.ok(sources.has(d), `${file}: description "${d.slice(0, 70)}..." is not any route's usePageMeta text`)
  }
})

test('shells do not leak another route into their markup', opts, () => {
  /* Every shell is built from the same index.html, and the home page's shell is
     written LAST. Getting that order wrong once stamped the home route's
     preloads onto all six others, so this checks the rendered body too. */
  const projects = bodyText(read('projects.html'))
  const colophon = bodyText(read('colophon.html'))
  assert.ok(projects.includes('Competitive Design'), 'projects.html is missing its own content')
  assert.ok(colophon.includes('Written by hand'), 'colophon.html is missing its own content')
  assert.ok(!colophon.includes('Competitive Design'), 'colophon.html contains the projects route')
})

test('the prerendered markup is hydratable, not a static snapshot', opts, () => {
  // The entry module must still be linked, or the page ships as dead HTML.
  for (const { file } of ROUTES) {
    const html = read(file)
    assert.match(html, /<script type="module"[^>]+src="\/assets\/[^"]+\.js"/, `${file} has no entry script`)
  }
})

test('the 404 shell is a real 404, not a copy of the home page', opts, () => {
  /* Unknown paths used to be rewritten to index.html, so a typo'd URL answered
     200 carrying the home page's title, canonical and Person schema. The
     catch-all rewrite is gone and Vercel serves this file with a 404 status,
     so it has to be the 404 page and has to claim nothing. */
  const html = read('404.html')
  assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1], 'Nic Piraino | Page not found')
  assert.match(html, /<meta name="robots" content="noindex"/, '404 must be noindex')
  assert.ok(!/<link\s+rel="canonical"/.test(html), '404 must not claim a canonical URL')
  assert.ok(!/<meta\s+property="og:url"/.test(html), '404 must not claim an og:url')
  assert.ok(bodyText(html).includes('404'), '404 shell is missing its own content')
})

/* React 18.3's renderToPipeableStream can leave a stray U+0000 in its output
   when a multi-byte UTF-8 character (°, µ, Ω, →, ...) falls on one of its
   internal 2048-byte buffer boundaries. Whether it happens depends only on the
   byte offset, so any content edit can move it onto a character: it appeared
   in hardware.html as "Tg: 55\u0000°C" after the redesign shifted the page.
   A NUL in the shell is a hydration text mismatch, and React 18 answers that
   by throwing the prerendered DOM away and rendering the route from scratch. */
test('no prerendered shell contains a NUL character', opts, () => {
  for (const file of [...ROUTES.map((r) => r.file), '404.html']) {
    const html = read(file)
    const at = html.indexOf('\u0000')
    assert.equal(at, -1, `${file} has a NUL at ${at}: ${JSON.stringify(html.slice(Math.max(0, at - 30), at + 10))}`)
  }
})

/* /photography redirects to /hobbies?tab=photography. That URL used to be
   served the ONE /hobbies shell, prerendered with the default Audio tab, so
   hydration mismatched: React re-rendered the panel (the photo grid appeared)
   but kept the tab bar's server attributes, leaving Audio aria-selected and
   latched while Photography was on screen. It shipped that way on production.
   Now there is a second shell, prerendered with Photography selected, and
   vercel.json serves it when the query asks for that tab. */
const selectedTab = (html) => {
  const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0])
  return tabs.map((t) => `${t.match(/id="([^"]+)"/)?.[1]}:${t.match(/aria-selected="([^"]+)"/)?.[1]}`).join(' ')
}

test('the default /hobbies shell has the Audio tab selected', opts, () => {
  const html = read('hobbies.html')
  assert.equal(selectedTab(html), 'tab-audio:true tab-photography:false')
  assert.match(html, /role="tabpanel"[^>]*id="panel-audio"|id="panel-audio"[^>]*role="tabpanel"/)
})

test('the photography shell is prerendered with Photography selected', opts, () => {
  const html = read('hobbies-photography.html')
  assert.equal(selectedTab(html), 'tab-audio:false tab-photography:true')
  assert.match(html, /role="tabpanel"[^>]*id="panel-photography"|id="panel-photography"[^>]*role="tabpanel"/)
  assert.ok(bodyText(html).includes('Photography'), 'photography shell is missing the gallery')
  // Same page, same canonical: the query only picks a tab.
  assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1], 'https://nicpiraino.com/hobbies')
  assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1], 'Nic Piraino | Hobbies')
  assert.equal(html.indexOf('\u0000'), -1, 'photography shell has a NUL')
})

test('vercel.json serves the photography shell for ?tab=photography, before the plain /hobbies rewrite', () => {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))
  const i = cfg.rewrites.findIndex((r) => r.source === '/hobbies' && r.has?.some((h) => h.type === 'query' && h.key === 'tab' && h.value === 'photography'))
  const plain = cfg.rewrites.findIndex((r) => r.source === '/hobbies' && !r.has)
  assert.ok(i >= 0, 'no query-conditioned /hobbies rewrite')
  assert.equal(cfg.rewrites[i].destination, '/hobbies-photography.html')
  assert.ok(i < plain, 'the query rewrite must come before the plain /hobbies rewrite')
  const redirect = cfg.redirects.find((r) => r.source === '/photography')
  assert.equal(redirect?.destination, '/hobbies?tab=photography')
})

test('CD-page photo buttons reserve their image box before the lazy image loads', opts, () => {
  const html = read('hobbies/cd-player.html')
  const buttons = html.split('aria-label="Open the photograph full size').slice(1)
  assert.equal(buttons.length, 7, 'expected the seven repair photographs')
  for (const b of buttons) {
    const img = b.slice(0, b.indexOf('</button>')).match(/<img [^>]*>/)?.[0] ?? ''
    assert.match(img, /width="\d+"/, `photo without width: ${img.slice(0, 80)}`)
    assert.match(img, /height="\d+"/, `photo without height: ${img.slice(0, 80)}`)
  }
})

test('the home shell carries the selected-work index with all three entries', opts, async () => {
  const { FEATURED } = await import('../src/data/featured.js')
  const text = bodyText(read('index.html'))
  assert.ok(text.includes('Selected engineering work'), 'index.html is missing the featured heading')
  for (const f of FEATURED) assert.ok(text.includes(f.title), `index.html is missing "${f.title}"`)
})

test('the BLDC motor case study shell is complete and has one h1', opts, async () => {
  const { MOTOR_CASE_STUDY } = await import('../src/data/bldcCaseStudy.js')
  assert.ok(existsSync(join(DIST, 'projects/bldc-motor.html')), 'dist/projects/bldc-motor.html missing')
  const html = read('projects/bldc-motor.html')
  assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1], 'Nic Piraino | BLDC Motor Case Study')
  assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1], 'https://nicpiraino.com/projects/bldc-motor')
  assert.equal(html.match(/<meta property="og:url"\s+content="([^"]+)"/)?.[1], 'https://nicpiraino.com/projects/bldc-motor')
  assert.match(html, /<script type="application\/ld\+json">[\s\S]*"@type": "TechArticle"/, 'no TechArticle JSON-LD')
  const text = bodyText(html)
  for (const s of ['What went wrong', 'Engineering changes', 'Outcome and limitations', 'AaABbBCcC', ...MOTOR_CASE_STUDY.notReported])
    assert.ok(text.includes(s), `bldc-motor.html is missing "${s}"`)
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, 'expected exactly one <h1>')
})

test('vercel.json rewrites /projects/bldc-motor before /projects, and the sitemap lists it', () => {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'))
  const i = cfg.rewrites.findIndex((r) => r.source === '/projects/bldc-motor')
  const plain = cfg.rewrites.findIndex((r) => r.source === '/projects')
  assert.ok(i >= 0 && i < plain, 'the case-study rewrite must exist and precede /projects')
  assert.equal(cfg.rewrites[i].destination, '/projects/bldc-motor.html')
  assert.ok(readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8').includes('<loc>https://nicpiraino.com/projects/bldc-motor</loc>'))
})

test('MotorLab reads the shared motor record instead of defining its own', () => {
  const src = readFileSync(join(ROOT, 'src/components/hardware/MotorLab.jsx'), 'utf8')
  assert.ok(!src.includes('const CHALLENGES'), 'MotorLab still defines CHALLENGES')
  assert.ok(!src.includes('const MOTOR_SPECS'), 'MotorLab still defines MOTOR_SPECS')
  assert.match(src, /data\/bldcMotor/)
})

test('the projects shell ships the skill filter with All pressed', opts, () => {
  const html = read('projects.html')
  assert.match(html, /role="group"[^>]*aria-labelledby="skill-filter-legend"|aria-labelledby="skill-filter-legend"[^>]*role="group"/)
  const all = [...html.matchAll(/<button[^>]*aria-pressed="[^"]*"[^>]*>All<\/button>/g)].map((m) => m[0])
  assert.equal(all.length, 1, 'expected one All key')
  assert.match(all[0], /aria-pressed="true"/)
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1, 'only All may be pressed on first render')
})

test('the case study ships every evidence mark as a closed disclosure with its note', opts, async () => {
  const { MOTOR_EVIDENCE } = await import('../src/data/bldcCaseStudy.js')
  const html = read('projects/bldc-motor.html')
  const buttons = [...html.matchAll(/<button[^>]*class="evidence evidence-[a-z]+ evidence-button[^"]*"[^>]*>/g)].map((m) => m[0])
  // Phase resistance in the spec rail, three table rows, the spin-up outcome.
  assert.equal(buttons.length, 5, `expected 5 evidence buttons, found ${buttons.length}`)
  for (const b of buttons) {
    assert.match(b, /aria-expanded="false"/, 'a mark is prerendered open')
    const controls = b.match(/aria-controls="([^"]+)"/)?.[1]
    assert.ok(controls, 'a mark has no aria-controls')
    assert.match(html, new RegExp(`id="${controls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*hidden`), `panel ${controls} missing or not hidden`)
  }
  /* Each rendered mark opens onto the right note, in page order: the CALC
     phase resistance in the spec rail, the three table rows, the OBS spin-up
     in the outcome. A wrong key in the page would show one kind of mark with
     another kind's explanation behind it. */
  const keys = [...html.matchAll(/data-evidence-note="([^"]+)"[^>]*>\s*<button[^>]*class="evidence evidence-([a-z]+)/g)].map((m) => [m[1], m[2]])
  assert.deepEqual(keys, [
    ['phaseResistance', 'calc'], ['permeability', 'nom'], ['glassTransition', 'nom'], ['spinUp', 'obs'], ['spinUp', 'obs'],
  ])
  const text = bodyText(html)
  for (const n of Object.values(MOTOR_EVIDENCE)) {
    assert.ok(text.includes(n.quantity), `note "${n.quantity}" is not in the shell`)
  }
})

/* /hardware loads the shared motor record but not the case study's prose or
   evidence notes; those live in bldcCaseStudy.js so the hardware chunk graph
   does not carry text it never shows. */
test('the hardware chunks do not carry the case-study text', opts, async () => {
  const { readdirSync } = await import('node:fs')
  const { MOTOR_CASE_STUDY } = await import('../src/data/bldcCaseStudy.js')
  const assets = join(DIST, 'assets')
  const files = readdirSync(assets)
  const hardware = files.find((f) => /^HardwarePage-.*\.js$/.test(f))
  assert.ok(hardware, 'no HardwarePage chunk in dist/assets')
  const seen = new Set()
  const walk = (f) => {
    if (seen.has(f) || /^(vendor|index-)/.test(f)) return
    seen.add(f)
    const src = readFileSync(join(assets, f), 'utf8')
    for (const m of src.matchAll(/from"\.\/([^"]+\.js)"/g)) walk(m[1])
  }
  walk(hardware)
  const probe = MOTOR_CASE_STUDY.wentWrong.slice(0, 40)
  for (const f of seen) assert.ok(!readFileSync(join(assets, f), 'utf8').includes(probe), `${f} (loaded by /hardware) carries case-study prose`)
})
