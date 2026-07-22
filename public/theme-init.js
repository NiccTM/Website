/*
 * Applies the saved theme before React mounts, so there is no flash of the
 * wrong theme on first paint.
 *
 * This lives in a real file rather than an inline <script> so that the CSP can
 * drop 'unsafe-inline' from script-src. A static build cannot use nonces (they
 * must be unique per response, which needs server-rendered HTML), and a hash
 * would silently break the moment this code is edited. An external file needs
 * neither: 'self' covers it.
 *
 * Must stay render-blocking (no defer/async) and load before the app bundle.
 */
try {
  var t = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', t)
} catch (e) {
  /* private mode / storage disabled — fall through to the CSS default */
}
