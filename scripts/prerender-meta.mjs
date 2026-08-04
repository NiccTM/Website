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
 * exact same SPA -- react-router reads location.pathname and renders as usual.
 *
 * The per-route text is PARSED OUT OF THE ROUTE COMPONENTS rather than being
 * duplicated here, so it cannot drift from what usePageMeta sets at runtime.
 * Anything unparseable is a hard error: shipping silently wrong social previews
 * is worse than failing the build.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { projects } from '../src/data/config.js'
import { firstProjectImage } from '../src/data/projectImages.js'
import { thumbSrc, avifThumbSrc } from '../src/utils/thumbs.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://nicpiraino.com'
const DEFAULT_TITLE = 'Nic Piraino | Hardware Engineering & System Design'

// route path -> route component file. Mirrors the <Route> table in App.jsx.
// Keys may be nested ('hardware/reference'); the output directory is created
// as needed so a sub-route still gets its own shell and its own meta.
const ROUTES = {
  projects:              'ProjectsPage.jsx',
  hardware:              'HardwarePage.jsx',
  'hardware/reference':  'ReferencePage.jsx',
  hobbies:               'HobbiesPage.jsx',
  about:                 'AboutPage.jsx',
  colophon:              'ColophonPage.jsx',
}

/* Which route component each shell should preload. Keyed the same way as
   ROUTES, plus '' for the home page, whose shell is dist/index.html itself. */
const PRELOAD_SRC = {
  '':                    'src/routes/HomePage.jsx',
  projects:              'src/routes/ProjectsPage.jsx',
  hardware:              'src/routes/HardwarePage.jsx',
  'hardware/reference':  'src/routes/ReferencePage.jsx',
  hobbies:               'src/routes/HobbiesPage.jsx',
  about:                 'src/routes/AboutPage.jsx',
  colophon:              'src/routes/ColophonPage.jsx',
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/*
 * ROUTE CHUNK PRELOADING
 *
 * Every route component is behind lazy(), so the browser cannot discover its
 * chunk until the entry bundle has downloaded, parsed and run. Profiled on the
 * home page under mobile throttling, that showed up as a clean two-stage
 * waterfall: the entry chunks finished at 1101ms, and HomePage.js -- all of
 * 8 KB -- did not even START until 1174ms, landing at 1405ms against an FCP of
 * 1848ms. The main thread was idle 94% of that time. It was never CPU; it was
 * a second round trip for a file the browser could have fetched at 220ms if
 * anything had told it the file existed.
 *
 * A modulepreload in the shell tells it. Measured A/B on the built output,
 * five runs each: median FCP 1904ms -> 1732ms.
 *
 * Each shell preloads only its OWN route, which is the point of doing it here
 * rather than in index.html: /projects.html preloads the projects chunk, not
 * the home one. Chunks the entry already pulls in are skipped, since those are
 * preloaded by Vite's own tags.
 */
const manifest = JSON.parse(readFileSync(join(ROOT, 'dist/.vite/manifest.json'), 'utf8'))

/** Transitive chunk files reachable from a manifest key. */
function collectChunks(key, seen = new Set()) {
  if (seen.has(key)) return seen
  seen.add(key)
  const entry = manifest[key]
  if (!entry) return seen
  for (const imp of entry.imports ?? []) collectChunks(imp, seen)
  return seen
}

const toFiles = (keys) =>
  [...keys].map((k) => manifest[k]?.file).filter(Boolean)

// Everything the entry already loads. index.html is the entry's manifest key.
const entryFiles = new Set(toFiles(collectChunks('index.html')))

function preloadTags(routeKey) {
  const src = PRELOAD_SRC[routeKey]
  if (!src) return ''
  if (!manifest[src]) throw new Error(`prerender-meta: ${src} missing from the build manifest`)
  const files = toFiles(collectChunks(src)).filter((f) => !entryFiles.has(f))
  if (!files.length) return ''
  return files.map((f) => `    <link rel="modulepreload" crossorigin href="/${f}">`).join('\n') + '\n'
}

/*
 * LCP IMAGE PRELOADING
 *
 * A modulepreload gets the route's CODE moving early, but the route's LCP IMAGE
 * is still invisible to the browser until that code has run and rendered. On
 * /projects that showed up as a Load Delay of 2,293ms against a Load Time of
 * 791ms -- 67% of LCP spent not asking for a file that takes under a second to
 * arrive. The card was already loading="eager" with fetchpriority="high", which
 * is why an earlier attempt at this did nothing: priority cannot help a request
 * that has not been discovered. Only the HTML can start it before React mounts.
 *
 * The href is COMPUTED from the same module the grid renders from, never
 * hardcoded, so reordering the projects moves the preload with it. A stale
 * preload would be worse than none: a second image fetched at high priority
 * while the real LCP element is still discovered late.
 *
 * The tag has to match what <picture> will choose or the image downloads twice.
 * Picture renders <source type="image/avif"> with an <img> jpg/png fallback, so
 * the preload mirrors it: type="image/avif" + imagesrcset. A browser that
 * cannot decode AVIF ignores the tag on the type and loads the <img> as before,
 * which is the same outcome it had without any of this.
 */
const LCP_IMAGE = { projects: firstProjectImage(projects) }

function lcpImageTag(routeKey) {
  const src = LCP_IMAGE[routeKey]
  if (!src) return ''

  const avif = avifThumbSrc(src)
  if (!avif) throw new Error(`prerender-meta: no thumbnail derivative for the /${routeKey} LCP image "${src}"`)

  // The file has to exist, or this preloads a 404 at high priority.
  const onDisk = join(ROOT, 'public', decodeURIComponent(avif).replace(/^\//, ''))
  if (!existsSync(onDisk)) throw new Error(`prerender-meta: ${avif} is not in public/ -- run scripts/generate-avif.ps1`)

  const href = encodeURI(avif)
  return `    <link rel="preload" as="image" type="image/avif" imagesrcset="${href}" fetchpriority="high">\n`
}

function injectPreloads(html, routeKey) {
  const tags = lcpImageTag(routeKey) + preloadTags(routeKey)
  if (!tags) return html
  if (!html.includes('</head>')) throw new Error('prerender-meta: </head> not found in dist/index.html')
  return html.replace('</head>', tags + '</head>')
}

/** Pulls the ('Title', 'description') pair out of a route's usePageMeta call. */
function readRouteMeta(file) {
  const src = readFileSync(join(ROOT, 'src/routes', file), 'utf8')
  // The trailing `,?` matters: a multi-line call with a trailing comma before
  // the closing paren is normal formatting, and without it this throws and
  // fails the whole build.
  const m = src.match(/usePageMeta\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,?\s*\)/)
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

  html = injectPreloads(html, route)

  const outFile = join(ROOT, `dist/${route}.html`)
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
  console.log(`  prerendered /${route}  ->  ${fullTitle}`)
  written++
}

/* The home page has no separate shell -- it IS dist/index.html -- so its
   preloads are written back into the file. This has to happen AFTER the loop
   above, which builds every other shell from `shell`, the copy read before any
   of this ran. Doing it first would stamp the home page's chunks onto all six
   other routes. */
writeFileSync(join(ROOT, 'dist/index.html'), injectPreloads(shell, ''))
console.log('  preloaded home route chunks into dist/index.html')

console.log(`prerender-meta: wrote ${written} route shells`)
