/**
 * Vercel Serverless Function — /api/discogs
 *
 * Proxies NiccTM's Discogs collection. Token stays server-side only.
 * Set DISCOGS_PAT in Vercel dashboard env vars (and .env locally).
 *
 * Returns a lightweight array:
 *   [{ id, artist, title, year, cover_image }, ...]
 *
 * Cache-Control: s-maxage=86400 → Vercel CDN caches for 24h,
 * stale-while-revalidate=3600 → serves stale for 1h while refreshing.
 */

const DISCOGS_URL =
  'https://api.discogs.com/users/NiccTM/collection/folders/0/releases' +
  '?sort=added&sort_order=desc&per_page=50'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.DISCOGS_PAT
  if (!token) {
    return res.status(500).json({ error: 'DISCOGS_PAT not configured.' })
  }

  try {
    const upstream = await fetch(DISCOGS_URL, {
      headers: {
        Authorization: `Discogs token=${token}`,
        'User-Agent': 'NicPirainoPortfolio/1.0 +https://github.com/NiccTM',
      },
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: text })
    }

    const data = await upstream.json()

    // Map to minimal payload — never send raw Discogs response to client
    const releases = (data.releases ?? []).map((r) => ({
      id:          r.id,
      artist:      r.basic_information?.artists?.[0]?.name ?? 'Unknown Artist',
      title:       r.basic_information?.title ?? 'Unknown Title',
      year:        r.basic_information?.year || null,
      cover_image: r.basic_information?.cover_image ?? null,
    }))

    // Aggressive caching — 24h on CDN, 1h stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json(releases)
  } catch (err) {
    console.error('[/api/discogs]', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
