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
