import { lazy } from 'react'

/**
 * React.lazy that survives a deployment happening mid-visit.
 *
 * THE PROBLEM
 * -----------
 * Every route on this site is code-split, and the chunk filenames are
 * content-hashed. When a new build goes out, the old hashes stop existing. So a
 * visitor who loaded the site before a deploy and clicks through to another
 * route afterwards requests a file that is now a 404, the dynamic import
 * rejects, and the whole app falls into its ErrorBoundary.
 *
 * The Retry button there cannot help, which is what makes this worth fixing
 * properly rather than leaving to the user. React.lazy MEMOISES the promise it
 * got back, including a rejected one, so re-rendering asks for the same dead
 * URL and fails again immediately. Retry is a no-op forever; only a manual hard
 * reload gets out of it.
 *
 * Vercel sells Skew Protection to paper over exactly this by pinning a session
 * to the deployment it started on. This does the same job for free and without
 * depending on the host: the fresh HTML names the new chunks, so one reload is
 * all it takes.
 *
 * WHY IT CANNOT LOOP
 * ------------------
 * A reload that fails the same way would be a redirect loop, so the timestamp
 * of the last attempt goes in sessionStorage and a second failure inside the
 * cooldown is allowed to reach the ErrorBoundary instead. That matters because
 * a chunk can 404 for reasons a reload will never fix -- a broken deploy, an
 * offline client, a proxy mangling responses -- and an infinite reload is a far
 * worse failure than an error panel.
 *
 * sessionStorage rather than localStorage so it resets with the tab, and every
 * access is guarded: Safari in private mode throws on access rather than
 * returning null, and a storage exception here would replace a recoverable
 * chunk error with an unrecoverable one.
 */

const KEY = 'chunk-reload-at'
const COOLDOWN_MS = 10_000

/* Browsers disagree on the wording, and none of them use a distinct error
   type, so matching the message is the only option available.
     Chrome/Edge  "Failed to fetch dynamically imported module: <url>"
     Firefox      "error loading dynamically imported module"
     Safari       "Importing a module script failed."
   Anything unrecognised is re-thrown untouched -- a genuine runtime error
   inside a route component must not be answered with a page reload. */
const isChunkLoadError = (err) => {
  const msg = String(err?.message ?? err ?? '')
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk \d+ failed/i.test(msg)
}

const readLastAttempt = () => {
  try { return Number(window.sessionStorage.getItem(KEY)) || 0 } catch { return 0 }
}
const markAttempt = () => {
  try { window.sessionStorage.setItem(KEY, String(Date.now())) } catch { /* storage blocked; one reload is still worth attempting */ }
}

export function lazyWithReload(factory) {
  return lazy(() =>
    factory().catch((err) => {
      if (typeof window === 'undefined' || !isChunkLoadError(err)) throw err
      if (Date.now() - readLastAttempt() < COOLDOWN_MS) throw err

      markAttempt()
      window.location.reload()
      /* Never settles, on purpose. The document is being torn down; resolving
         would flash the Suspense fallback or the error panel on the way out. */
      return new Promise(() => {})
    }),
  )
}
