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
  { file: 'hardware.html',          path: '/hardware',           title: 'Nic Piraino | Hardware Lab' },
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
