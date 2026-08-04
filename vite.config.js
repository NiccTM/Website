import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { validateImageUrl, fetchUpstreamImage } from './api/_lib/upstream-image.js'

const DISCOGS_URL =
  'https://api.discogs.com/users/NiccTM/collection/folders/0/releases' +
  '?sort=added&sort_order=desc&per_page=50'

/**
 * Local stand-in for the Vercel serverless functions in api/, so the site works
 * without the Vercel CLI. Reads secrets from .env and never exposes them to the
 * client. In production the real api/*.js functions take over.
 *
 * Registered for BOTH `vite dev` and `vite preview`: preview runs its own
 * server that does not call configureServer, so without configurePreviewServer
 * every /api/* request falls through to the SPA catch-all and returns
 * index.html — which surfaces as `Unexpected token '<'` when the client
 * calls .json() on it.
 */
function registerApiMiddleware(server, env) {
  {
      // Image proxy — makes Discogs CDN art same-origin for TextureLoader.
      // This previously fetched ANY url with no allowlist at all, so dev and
      // production disagreed about what was permitted. It now runs the exact
      // same validation as the deployed function.
      server.middlewares.use('/api/image-proxy', async (req, res) => {
        const raw = new URL(req.url, 'http://localhost').searchParams.get('url')

        const check = validateImageUrl(raw)
        if (!check.ok) {
          res.writeHead(check.status, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: check.error }))
          return
        }

        const result = await fetchUpstreamImage(check.url)
        if (!result.ok) {
          res.writeHead(result.status, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: result.error }))
          return
        }

        // No Access-Control-Allow-Origin, matching the deployed function: the
        // site calls this same-origin, so CORS never applies, and '*' would let
        // any other site use it as a free image CDN from script.
        res.writeHead(200, {
          'Content-Type': result.contentType,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        })
        res.end(result.body)
      })

      // Classify proxy — keeps ROBOFLOW_API_KEY off the client in dev
      server.middlewares.use('/api/classify', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        const apiKey   = env.ROBOFLOW_API_KEY
        const modelId  = env.ROBOFLOW_MODEL_ID ?? 'ecosort/1'
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ROBOFLOW_API_KEY not set in .env' }))
          return
        }
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const { image, confidence = 35, overlap = 30 } = JSON.parse(Buffer.concat(chunks).toString())
          const rfRes = await fetch(
            `https://detect.roboflow.com/${modelId}?api_key=${apiKey}&confidence=${confidence}&overlap=${overlap}&labels=true`,
            { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: image }
          )
          const data = await rfRes.json()
          res.writeHead(rfRes.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify(data))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      server.middlewares.use('/api/discogs', async (req, res) => {
        const token = env.DISCOGS_PAT
        if (!token || token === 'your_token_here') {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'DISCOGS_PAT not set in .env' }))
          return
        }

        try {
          const upstream = await fetch(DISCOGS_URL, {
            headers: {
              Authorization: `Discogs token=${token}`,
              'User-Agent': 'NicPirainoPortfolio/1.0 +https://github.com/NiccTM',
            },
          })

          if (!upstream.ok) {
            res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `Discogs returned ${upstream.status}` }))
            return
          }

          const data = await upstream.json()
          const releases = (data.releases ?? []).map((r) => ({
            id:          r.id,
            artist:      r.basic_information?.artists?.[0]?.name ?? 'Unknown Artist',
            title:       r.basic_information?.title ?? 'Unknown Title',
            year:        r.basic_information?.year ?? null,
            cover_image: r.basic_information?.cover_image ?? null,
          }))

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',  // dev: always fresh
          })
          res.end(JSON.stringify(releases))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
  }
}

function localApiPlugin(env) {
  return {
    name: 'local-api',
    configureServer(server)        { registerApiMiddleware(server, env) },
    configurePreviewServer(server) { registerApiMiddleware(server, env) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')   // load .env without VITE_ prefix filter

  return {
    plugins: [react(), localApiPlugin(env)],
    server: {
      port: 4000,
      open: true,
    },
    build: {
      target: 'esnext',
      /* `true` = Vite 8's default minifier (oxc, built into rolldown). This was
         'esbuild', but Vite 8 no longer ships esbuild as a dependency, so
         naming it explicitly fails with "Cannot find package 'esbuild'".
         Dropping esbuild is also what cleared its dev-server advisory. */
      minify: true,
      rollupOptions: {
        output: {
          /* Function form, not the object map. Vite 8 bundles with rolldown
             instead of rollup, and rolldown's manualChunks accepts only a
             function — the object form fails the build with "manualChunks is
             not a function". Matching on a node_modules path segment keeps the
             same five vendor chunks as before. */
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            const inPkg = (...names) =>
              names.some((n) => id.includes(`node_modules/${n}/`) || id.includes(`node_modules\\${n}\\`))
            if (inPkg('react', 'react-dom', 'react-router-dom', 'react-router')) return 'vendor-react'
            if (inPkg('three', '@react-three/fiber', '@react-three/drei')) return 'vendor-three'
            /* reactflow deliberately has NO rule here. Forcing it into a named
               manual chunk pinned it into the entry's static import graph:
               dist/index.html emitted a modulepreload for vendor-flow, so all
               273 KB downloaded on / and /about, which have no diagram on them
               at all. Measured on production: 91 KB gzip, about half the home
               page's script. Without a rule, rolldown lets it follow the two
               lazy() diagram imports and it is fetched only when a diagram
               renders. vendor-three keeps its rule and stays async, so this is
               not a general problem with manualChunks -- the difference seems
               to be that reactflow has two dynamic importers and three has one,
               though that mechanism is a guess. The behaviour is not: removing
               the rule is what makes the preload go away. Re-check
               dist/index.html for a vendor-flow modulepreload before adding any
               rule back. */
            if (inPkg('framer-motion', 'motion-dom', 'motion-utils')) return 'vendor-motion'
            if (inPkg('zustand')) return 'vendor-store'
          },
        },
      },
    },
  }
})
