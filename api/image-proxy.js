/**
 * Vercel Serverless Function — /api/image-proxy
 *
 * Proxies Discogs CDN cover art so the browser (and three.js TextureLoader)
 * sees a same-origin image. Validation lives in _lib/upstream-image.js and is
 * shared with the dev/preview middleware so the two cannot drift.
 */
import { validateImageUrl, fetchUpstreamImage } from './_lib/upstream-image.js'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const check = validateImageUrl(req.query.url)
  if (!check.ok) return res.status(check.status).json({ error: check.error })

  const result = await fetchUpstreamImage(check.url)
  if (!result.ok) return res.status(result.status).json({ error: result.error })

  res.setHeader('Content-Type', result.contentType)
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
  res.setHeader('Access-Control-Allow-Origin', '*')
  // The response is always an image; stop any content-type sniffing on it.
  res.setHeader('X-Content-Type-Options', 'nosniff')
  return res.status(200).send(result.body)
}
