/**
 * Writes one prerendered HTML shell per route into dist/, each carrying that
 * route's real <title>, description, canonical and Open Graph / Twitter tags.
 *
 * WHY THIS EXISTS
 * ---------------
 * usePageMeta updates those tags at runtime, which is enough for crawlers that
 * execute JavaScript (Google). It is NOT enough for social scrapers:
 * LinkedInBot, facebookexternalhit, Twitterbot, Slack and Discord read the raw
 * HTML of the first response and never run the bundle. Against a pure SPA they
 * therefore saw index.html's home-page tags for every route, so a shared link
 * to /projects previewed as "Hardware Engineering & System Design".
 *
 * Prerendering at build time fixes that with zero runtime cost: each route is a
 * plain static file, and vercel.json rewrites /projects to /projects.html. The
 * shell is byte-identical to index.html apart from the meta, so it boots the
 * exact same SPA — react-router reads location.pathname and renders as usual.
 *
 * The per-route text is PARSED OUT OF THE ROUTE COMPONENTS rather than being
 * duplicated here, so it cannot drift from what usePageMeta sets at runtime.
 * Anything unparseable is a hard error: shipping silently wrong social previews
 * is worse than failing the build.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://nicpiraino.com'
const DEFAULT_TITLE = 'Nic Piraino | Hardware Engineering & System Design'

// route path -> route component file. Mirrors the <Route> table in App.jsx.
const ROUTES = {
  projects:    'ProjectsPage.jsx',
  hardware:    'HardwarePage.jsx',
  archive:     'ArchivePage.jsx',
  systems:     'SystemsPage.jsx',
  photography: 'PhotographyPage.jsx',
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Pulls the ('Title', 'description') pair out of a route's usePageMeta call. */
function readRouteMeta(file) {
  const src = readFileSync(join(ROOT, 'src/routes', file), 'utf8')
  const m = src.match(/usePageMeta\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/)
  if (!m) throw new Error(`prerender-meta: could not parse usePageMeta() in ${file}`)
  const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  return { title: unescape(m[1]), description: unescape(m[2]) }
}

/** Swaps one tag's content/href, erroring if the tag is missing from the shell. */
function replaceTag(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`prerender-meta: ${label} not found in dist/index.html`)
  return html.replace(pattern, replacement)
}

const shell = readFileSync(join(ROOT, 'dist/index.html'), 'utf8')
let written = 0

for (const [route, file] of Object.entries(ROUTES)) {
  const { title, description } = readRouteMeta(file)
  const fullTitle = title ? `Nic Piraino | ${title}` : DEFAULT_TITLE
  const url = `${SITE}/${route}`
  const t = esc(fullTitle)
  const d = esc(description)

  let html = shell
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`, '<title>')
  html = replaceTag(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${d}$2`, 'description')
  html = replaceTag(html, /(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${t}$2`, 'og:title')
  html = replaceTag(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${d}$2`, 'og:description')
  html = replaceTag(html, /(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${url}$2`, 'og:url')
  html = replaceTag(html, /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${t}$2`, 'twitter:title')
  html = replaceTag(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${d}$2`, 'twitter:description')
  html = replaceTag(html, /(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`, 'canonical')

  writeFileSync(join(ROOT, `dist/${route}.html`), html)
  console.log(`  prerendered /${route}  ->  ${fullTitle}`)
  written++
}

console.log(`prerender-meta: wrote ${written} route shells`)
