/**
 * Locks in the two properties that make the rate limiter safe to ship before
 * any Upstash account exists:
 *
 *   1. Unconfigured  -> strict no-op, nothing is ever blocked.
 *   2. Redis broken  -> fails OPEN, never throws, site stays up.
 *
 * A regression in either would take the public API down rather than protect it,
 * which is the failure mode worth a test.
 *
 *   node --test tests/
 */
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit, applyRateLimit, isRateLimitConfigured, clientKey } from '../api/_lib/rate-limit.js'

const req = (ip) => ({ headers: ip ? { 'x-forwarded-for': ip } : {} })

const fakeRes = () => ({
  headers: {}, statusCode: null, body: null,
  setHeader(k, v) { this.headers[k] = v },
  status(c) { this.statusCode = c; return this },
  json(b) { this.body = b; return this },
})

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

test('reports unconfigured when env vars are absent', () => {
  assert.equal(isRateLimitConfigured(), false)
})

test('unconfigured is a strict no-op even past the limit', async () => {
  for (let i = 0; i < 5; i++) {
    const v = await rateLimit(req('203.0.113.9'), { route: 't', limit: 1, windowSeconds: 60 })
    assert.equal(v.limited, false)
    assert.equal(v.remaining, undefined, 'must not advertise limit headers when inactive')
  }
})

test('applyRateLimit sends nothing when not limited', () => {
  const res = fakeRes()
  const handled = applyRateLimit(res, { limited: false }, 10)
  assert.equal(handled, false)
  assert.equal(res.statusCode, null)
})

test('applyRateLimit sends 429 with Retry-After when limited', () => {
  const res = fakeRes()
  const handled = applyRateLimit(res, { limited: true, remaining: 0, resetSeconds: 42 }, 10)
  assert.equal(handled, true)
  assert.equal(res.statusCode, 429)
  assert.equal(res.headers['Retry-After'], '42')
  assert.equal(res.headers['X-RateLimit-Limit'], '10')
  assert.match(res.body.error, /too many/i)
})

test('fails OPEN when Redis is unreachable, and does not throw', async () => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://127.0.0.1:1'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'bogus'
  assert.equal(isRateLimitConfigured(), true)
  const v = await rateLimit(req('203.0.113.9'), { route: 't', limit: 1, windowSeconds: 60 })
  assert.equal(v.limited, false, 'a limiter outage must not block traffic')
})

test('clientKey takes the first x-forwarded-for hop', () => {
  assert.equal(clientKey(req('203.0.113.9, 10.0.0.1, 172.16.0.1')), '203.0.113.9')
  assert.equal(clientKey(req('  198.51.100.7  ')), '198.51.100.7')
  assert.equal(clientKey(req()), 'unknown')
})
