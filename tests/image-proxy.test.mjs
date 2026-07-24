/**
 * Locks in the image-proxy validation that closed the open-proxy/SSRF hole.
 *
 * Uses node:test, which ships with Node -- no dev dependency, which matters
 * because these cases were previously only ever checked by hand against a
 * running server, and hand checks do not survive a refactor.
 *
 *   node --test tests/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateImageUrl, ALLOWED_IMAGE_HOSTS, MAX_IMAGE_BYTES } from '../api/_lib/upstream-image.js'

const ok = (u) => validateImageUrl(u).ok
const err = (u) => validateImageUrl(u).status

test('accepts the real Discogs CDN host over https', () => {
  assert.equal(ok('https://i.discogs.com/abc/R-123.jpeg'), true)
})

test('rejects suffix-match bypasses that the old endsWith() check allowed', () => {
  // Each of these satisfies hostname.endsWith('discogs.com') or
  // .endsWith('discogs-cdn.com') and is registerable by anyone.
  for (const host of ['evil-discogs.com', 'notdiscogs.com', 'xdiscogs-cdn.com', 'mydiscogs.com']) {
    assert.equal(ok(`https://${host}/x.jpg`), false, `${host} must be rejected`)
    assert.equal(err(`https://${host}/x.jpg`), 403)
  }
})

test('rejects a look-alike that merely contains the domain', () => {
  assert.equal(ok('https://discogs.com.attacker.net/x.jpg'), false)
})

test('rejects non-https schemes, including internal targets', () => {
  for (const u of [
    'http://i.discogs.com/x.jpg',
    'http://169.254.169.254/latest/meta-data/',   // cloud metadata
    'http://127.0.0.1:8080/',                     // loopback
    'file:///C:/Windows/win.ini',
    'gopher://i.discogs.com/',
  ]) {
    assert.equal(ok(u), false, `${u} must be rejected`)
  }
})

test('rejects credentials in the URL (userinfo confusion)', () => {
  const v = validateImageUrl('https://i.discogs.com@attacker.tld/x.jpg')
  assert.equal(v.ok, false)
  assert.equal(v.status, 400)
})

test('rejects non-standard ports on an allowlisted host', () => {
  assert.equal(ok('https://i.discogs.com:8080/x.jpg'), false)
  assert.equal(ok('https://i.discogs.com:443/x.jpg'), true, 'explicit 443 is still standard')
})

test('rejects missing and malformed input', () => {
  assert.equal(validateImageUrl(undefined).status, 400)
  assert.equal(validateImageUrl('').status, 400)
  assert.equal(validateImageUrl('not a url').status, 400)
})

test('allowlist is exact-match, not substring', () => {
  assert.ok(ALLOWED_IMAGE_HOSTS.has('i.discogs.com'))
  assert.ok(!ALLOWED_IMAGE_HOSTS.has('discogs.com'))
  assert.ok(MAX_IMAGE_BYTES > 0)
})
