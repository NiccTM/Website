/**
 * Fixed-window rate limiting for the public /api routes.
 *
 * Deliberately dependency-free: it talks to Upstash Redis over its REST API
 * with plain fetch rather than pulling in @upstash/ratelimit. That keeps the
 * install surface unchanged and means this can ship before any account exists.
 *
 * BEHAVIOUR WHEN UNCONFIGURED: if UPSTASH_REDIS_REST_URL / _TOKEN are absent,
 * every call returns { limited: false } and the routes behave exactly as they
 * do today. Adding the two env vars in Vercel switches limiting on with no code
 * change and no redeploy of logic.
 *
 * FAILS OPEN. If Redis is unreachable or errors, requests are allowed through.
 * For a portfolio site, a limiter outage must not take the site down with it --
 * the threat here is bandwidth abuse, not data loss.
 *
 * Serverless functions cannot rate limit in memory: each instance has its own
 * heap, instances are created and destroyed constantly, and a caller is spread
 * across them. Shared state is what makes this real rather than decorative.
 */

const URL_ENV = 'UPSTASH_REDIS_REST_URL'
const TOKEN_ENV = 'UPSTASH_REDIS_REST_TOKEN'

export const isRateLimitConfigured = () =>
  Boolean(process.env[URL_ENV] && process.env[TOKEN_ENV])

/** Best-effort client identity. Vercel sets x-forwarded-for at the edge. */
export function clientKey(req) {
  const fwd = req.headers['x-forwarded-for']
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim()
  return ip || req.headers['x-real-ip'] || 'unknown'
}

/**
 * @returns {Promise<{limited: boolean, remaining?: number, resetSeconds?: number}>}
 */
export async function rateLimit(req, { route, limit = 60, windowSeconds = 60 } = {}) {
  if (!isRateLimitConfigured()) return { limited: false }

  const base = process.env[URL_ENV].replace(/\/+$/, '')
  const token = process.env[TOKEN_ENV]
  // Bucket by window start so the key expires naturally and no cleanup is needed.
  const window = Math.floor(Date.now() / 1000 / windowSeconds)
  const key = `rl:${route}:${clientKey(req)}:${window}`

  try {
    // Pipeline INCR + EXPIRE so the key can never be left without a TTL.
    const res = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds)],
      ]),
    })
    if (!res.ok) return { limited: false }        // fail open
    const out = await res.json()
    const count = Number(out?.[0]?.result ?? 0)
    if (!Number.isFinite(count) || count <= 0) return { limited: false }

    return {
      limited: count > limit,
      remaining: Math.max(0, limit - count),
      resetSeconds: windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds),
    }
  } catch {
    return { limited: false }                     // fail open
  }
}

/** Applies standard headers and a 429 body. Returns true if it handled the response. */
export function applyRateLimit(res, verdict, limit) {
  if (verdict.remaining !== undefined) {
    res.setHeader('X-RateLimit-Limit', String(limit))
    res.setHeader('X-RateLimit-Remaining', String(verdict.remaining))
  }
  if (!verdict.limited) return false
  if (verdict.resetSeconds !== undefined) res.setHeader('Retry-After', String(verdict.resetSeconds))
  res.status(429).json({ error: 'Too many requests' })
  return true
}
