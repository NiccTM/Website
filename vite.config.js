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
    },
  }
})
