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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

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

function injectPreloads(html, routeKey) {
  const tags = preloadTags(routeKey)
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

/*
 * RENDERING THE ROUTE INTO THE SHELL
 *
 * Until this existed, every shell shipped an empty <div id="root"></div>. That
 * is fine for Google, which executes JavaScript, and useless for everything
 * that does not: LinkedIn, Slack, Discord and Bing read the first response and
 * stop. Measured against production, a crawler that does not run scripts saw
 * exactly 0 characters of body text on the home page.
 *
 * It is also the reason FCP and LCP landed on the same millisecond on every
 * route -- nothing could paint until React's first commit, roughly 130 KB of
 * gzipped JavaScript deep. Real markup in the shell paints immediately.
 *
 * The markup comes from the SSR bundle built by `vite build --ssr`, which
 * renders the same component tree the browser uses (App.jsx exports AppRoutes
 * for exactly this) wrapped in a StaticRouter. Nothing about the route table
 * is duplicated here, so the prerendered page cannot drift from the live one.
 */
const { render } = await import(pathToFileURL(join(ROOT, 'dist-ssr/entry-server.js')).href)

const ROOT_DIV = '<div id="root"></div>'

async function injectMarkup(html, routePath) {
  const { html: rendered, errors } = await render(routePath)

  /* A route that renders nothing is almost certainly a Suspense fallback that
     escaped, or a component that threw. Shipping that silently would leave the
     shell looking prerendered while containing nothing, which is worse than not
     prerendering at all -- so it fails the build instead. */
  if (rendered.replace(/<[^>]+>/g, '').trim().length < 200)
    throw new Error(`prerender-meta: ${routePath} rendered almost no text (${rendered.length} bytes of HTML)`)
  if (errors.length)
    throw new Error(`prerender-meta: ${routePath} produced render errors:\n${errors.join('\n')}`)
  if (!html.includes(ROOT_DIV))
    throw new Error(`prerender-meta: could not find ${ROOT_DIV} in the shell`)

  return html.replace(ROOT_DIV, `<div id="root">${rendered}</div>`)
}

/*
 * PER-ROUTE STRUCTURED DATA
 *
 * index.html carries a JSON-LD Person, and because every shell is built from
 * it, all seven routes serve that same block and nothing else. Person is the
 * right primary type for a name-based domain -- it is what lets a search for
 * "Nic Piraino" resolve here -- but it says nothing about what any individual
 * page IS.
 *
 * TechArticle on the voltage reference, because that page is a technical
 * write-up with measured results rather than a portfolio tile, and it is the
 * page the colophon says to look at first. Both Google and Bing use structured
 * data to decide what they can confidently extract and attribute, which is the
 * whole game for a site nobody links to yet.
 *
 * Built from the SAME title and description the meta tags use, so it cannot
 * drift from the page. Deliberately no datePublished: I do not know when the
 * work was done, and inventing a date to satisfy a schema validator would be
 * putting a false claim in machine-readable form on a site whose argument is
 * that claims should be checkable.
 */
const ROUTE_SCHEMA = {
  'hardware/reference': ({ title, description, url }) => ({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    inLanguage: 'en',
    author: { '@type': 'Person', name: 'Nic Piraino', url: `${SITE}/` },
    publisher: { '@type': 'Person', name: 'Nic Piraino', url: `${SITE}/` },
    isPartOf: { '@type': 'WebSite', name: 'Nic Piraino', url: `${SITE}/` },
    about: ['Voltage reference', 'Precision analog', 'Electrical metrology'],
  }),
}

function injectSchema(html, routeKey, meta) {
  const build = ROUTE_SCHEMA[routeKey]
  if (!build) return html
  const json = JSON.stringify(build(meta), null, 2)
  /* Escaping </script> inside JSON-LD: a description containing that sequence
     would close the block early and dump the rest as markup. */
  const safe = json.replace(/<\//g, '<\\/')
  const tag = `    <script type="application/ld+json">\n${safe}\n    </script>\n`
  return html.replace('</head>', tag + '</head>')
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
  html = injectSchema(html, route, { title: fullTitle, description, url })
  html = await injectMarkup(html, `/${route}`)

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
writeFileSync(join(ROOT, 'dist/index.html'), await injectMarkup(injectPreloads(shell, ''), '/'))
console.log('  preloaded home route chunks and rendered / into dist/index.html')

console.log(`prerender-meta: wrote ${written} route shells`)
