/**
 * Vercel Serverless Function — /api/classify
 *
 * Proxies image classification requests to the Roboflow API.
 * ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID are set in the Vercel dashboard —
 * they are NEVER exposed to client-side code.
 *
 * Request:  POST application/json  { image: "<base64 string>" }
 * Response: { predictions: [...] } forwarded from Roboflow
 *
 * Rate limit: 5 requests per IP per hour (in-memory, resets on cold start).
 * Global cap:  50 requests per hour across all visitors.
 */

// Allow up to 5 MB bodies (base64 bloat ~33% over raw)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

// ── In-memory rate limiting ────────────────────────────────────────────────────
// Map<ip, { count, resetAt }>
const ipBucket  = new Map()
const PER_IP_MAX   = 5           // requests per IP per window
const GLOBAL_MAX   = 50          // total requests per window
const WINDOW_MS    = 60 * 60 * 1000  // 1 hour

let globalCount  = 0
let globalReset  = Date.now() + WINDOW_MS

function checkRateLimit(ip) {
  const now = Date.now()

  // Reset global counter if window elapsed
  if (now > globalReset) {
    globalCount = 0
    globalReset = now + WINDOW_MS
  }
  if (globalCount >= GLOBAL_MAX) {
    return { limited: true, reason: 'Global demo limit reached — try again later.' }
  }

  // Per-IP bucket
  const bucket = ipBucket.get(ip)
  if (!bucket || now > bucket.resetAt) {
    ipBucket.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  } else if (bucket.count >= PER_IP_MAX) {
    const minsLeft = Math.ceil((bucket.resetAt - now) / 60000)
    return { limited: true, reason: `Rate limit: max ${PER_IP_MAX} classifications/hour. Resets in ${minsLeft} min.` }
  } else {
    bucket.count++
  }

  globalCount++
  return { limited: false }
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown'
  const { limited, reason } = checkRateLimit(ip)
  if (limited) {
    return res.status(429).json({ error: reason })
  }

  const apiKey   = process.env.ROBOFLOW_API_KEY
  const modelId  = process.env.ROBOFLOW_MODEL_ID ?? 'ecosort/1'

  if (!apiKey) {
    return res.status(500).json({ error: 'ROBOFLOW_API_KEY not configured.' })
  }

  try {
    const { image, confidence = 35, overlap = 30 } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Missing "image" field in request body.' })
    }

    const roboflowRes = await fetch(
      `https://detect.roboflow.com/${modelId}?api_key=${apiKey}&confidence=${confidence}&overlap=${overlap}&labels=true`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: image }
    )

    if (!roboflowRes.ok) {
      const text = await roboflowRes.text()
      return res.status(roboflowRes.status).json({ error: text })
    }

    const data = await roboflowRes.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('[/api/classify]', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
