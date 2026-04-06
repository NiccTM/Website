import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DISCOGS_URL =
  'https://api.discogs.com/users/NiccTM/collection/folders/0/releases' +
  '?sort=added&sort_order=desc&per_page=50'

/**
 * Vite dev-only plugin — serves /api/discogs without Vercel CLI.
 * Reads DISCOGS_PAT from .env, proxies to Discogs, returns mapped payload.
 * In production, the real api/discogs.js Vercel function takes over.
 */
function discogsDevPlugin(env) {
  return {
    name: 'discogs-dev-proxy',
    configureServer(server) {
      // Image proxy — bypasses CORS on Discogs CDN for TextureLoader
      server.middlewares.use('/api/image-proxy', async (req, res) => {
        const url = new URL(req.url, 'http://localhost').searchParams.get('url')
        if (!url) {
          res.writeHead(400); res.end('Missing url param'); return
        }
        try {
          const img = await fetch(url, {
            headers: { 'User-Agent': 'NicPirainoPortfolio/1.0 +https://github.com/NiccTM' },
          })
          const buf = await img.arrayBuffer()
          res.writeHead(200, {
            'Content-Type': img.headers.get('content-type') ?? 'image/jpeg',
            'Cache-Control': 's-maxage=86400',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(Buffer.from(buf))
        } catch {
          res.writeHead(502); res.end('Proxy error')
        }
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
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')   // load .env without VITE_ prefix filter

  return {
    plugins: [react(), discogsDevPlugin(env)],
    server: {
      port: 4000,
      open: true,
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
            'vendor-three':   ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-flow':    ['reactflow'],
            'vendor-motion':  ['framer-motion'],
            'vendor-store':   ['zustand'],
          },
        },
      },
    },
  }
})
