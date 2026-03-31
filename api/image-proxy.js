/**
 * Vercel Serverless Function — /api/image-proxy
 * Proxies Discogs CDN images to bypass browser CORS restrictions.
 * Only allows i.discogs.com as source domain.
 */
export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  // Allowlist — only proxy from Discogs CDN
  let parsed
  try { parsed = new URL(url) } catch { return res.status(400).json({ error: 'Invalid URL' }) }
  if (!parsed.hostname.endsWith('discogs.com') && !parsed.hostname.endsWith('discogs-cdn.com')) {
    return res.status(403).json({ error: 'Domain not allowed' })
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'NicPirainoPortfolio/1.0 +https://github.com/NiccTM' },
    })
    const buf = await upstream.arrayBuffer()

    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg')
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).send(Buffer.from(buf))
  } catch (err) {
    return res.status(502).json({ error: 'Upstream error' })
  }
}
