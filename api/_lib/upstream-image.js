/**
 * Shared validation for the image proxy, used by both the Vercel function
 * (api/image-proxy.js) and the local dev/preview middleware in vite.config.js,
 * so the two cannot drift apart. Files under api/ that begin with "_" are not
 * treated as routes by Vercel.
 *
 * The original check was:
 *
 *     hostname.endsWith('discogs.com') || hostname.endsWith('discogs-cdn.com')
 *
 * A suffix match on a hostname is not a domain check. "evil-discogs.com",
 * "notdiscogs.com" and "xdiscogs-cdn.com" all satisfy it, and any of them can
 * simply be registered — which turns this endpoint into an open proxy that
 * fetches arbitrary attacker-controlled URLs using the site's own egress.
 * A boundary-aware check ("." + domain, or exact equality) fixes the class;
 * an exact-host allowlist is stronger still, and is what is used here because
 * every cover URL Discogs returns uses a single host.
 */

// Verified against the live collection: all 50 releases serve covers from
// exactly this host, over https. Add hosts here if Discogs starts using more.
export const ALLOWED_IMAGE_HOSTS = new Set(['i.discogs.com'])

// Cover art is a few hundred KB. This is a generous ceiling that still stops
// the endpoint being used to relay arbitrarily large files at our expense.
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024

const UA = 'NicPirainoPortfolio/1.0 +https://github.com/NiccTM'

/** Returns { ok: true, url } or { ok: false, status, error }. */
export function validateImageUrl(raw) {
  if (!raw) return { ok: false, status: 400, error: 'Missing url param' }

  let u
  try { u = new URL(raw) } catch { return { ok: false, status: 400, error: 'Invalid URL' } }

  // Blocks file:, data:, gopher: and friends, and forces transport security.
  if (u.protocol !== 'https:') return { ok: false, status: 400, error: 'Only https URLs are allowed' }

  // https://i.discogs.com@attacker.tld/ style confusion, and credential leakage.
  if (u.username || u.password) return { ok: false, status: 400, error: 'Credentials are not allowed in the URL' }

  // Exact match, not a suffix test.
  if (!ALLOWED_IMAGE_HOSTS.has(u.hostname)) return { ok: false, status: 403, error: 'Host not allowed' }

  // An allowlisted name pointed at an unusual port is a smell, not a cover image.
  if (u.port && u.port !== '443') return { ok: false, status: 400, error: 'Non-standard port is not allowed' }

  return { ok: true, url: u }
}

/**
 * Fetches an already-validated URL with the remaining SSRF controls applied.
 * Returns { ok: true, contentType, body } or { ok: false, status, error }.
 */
export async function fetchUpstreamImage(url) {
  let upstream
  try {
    upstream = await fetch(url.toString(), {
      headers: { 'User-Agent': UA },
      // Critical: without this, an allowlisted host can 302 us to anywhere,
      // including link-local metadata addresses, and the allowlist is bypassed.
      redirect: 'manual',
    })
  } catch {
    return { ok: false, status: 502, error: 'Upstream fetch failed' }
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    return { ok: false, status: 502, error: 'Upstream redirected; not followed' }
  }
  if (!upstream.ok) return { ok: false, status: 502, error: `Upstream returned ${upstream.status}` }

  // Stops the endpoint laundering HTML/JS through our origin under our own
  // Cache-Control and CORS headers.
  const contentType = upstream.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    return { ok: false, status: 502, error: 'Upstream did not return an image' }
  }

  const declared = Number(upstream.headers.get('content-length') ?? 0)
  if (declared > MAX_IMAGE_BYTES) return { ok: false, status: 502, error: 'Image exceeds size limit' }

  const body = Buffer.from(await upstream.arrayBuffer())
  // Content-Length can lie or be absent; check what actually arrived too.
  if (body.length > MAX_IMAGE_BYTES) return { ok: false, status: 502, error: 'Image exceeds size limit' }

  return { ok: true, contentType, body }
}
