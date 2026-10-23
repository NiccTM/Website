import { Writable } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
/* react-router v7 collapsed the DOM/server split: react-router-dom now exports
   only '.', and StaticRouter lives in react-router itself. The old
   'react-router-dom/server' path fails to resolve. */
import { StaticRouter } from 'react-router'
import { AppRoutes } from './App'
import { joinStreamChunks } from './ssr/joinStreamChunks'

/**
 * Build-time entry. Renders a route to static HTML so the shell in dist/ ships
 * real content instead of an empty <div id="root">.
 *
 * Nothing here runs in production; scripts/prerender-meta.mjs imports the
 * SSR bundle, calls render() once per route, and throws the result away after
 * writing the HTML.
 *
 * WHY renderToPipeableStream RATHER THAN renderToString
 * -----------------------------------------------------
 * Every route is behind lazy(). renderToString is synchronous: it hits the
 * Suspense boundary, cannot wait for the dynamic import, and emits the FALLBACK
 * -- which for this app is `null`. The prerender would have produced an empty
 * page while appearing to succeed, which is the worst possible failure mode
 * here because the output looks plausible.
 *
 * renderToPipeableStream's onAllReady fires only once every Suspense boundary
 * has resolved, so the lazy routes are really rendered. That also means the
 * route table does not have to be duplicated in an eager form for the build --
 * the prerendered markup comes from the exact same component tree the browser
 * uses, so the two cannot drift.
 *
 * StaticRouter rather than BrowserRouter because BrowserRouter reads
 * window.history, which does not exist in Node. App.jsx exports AppRoutes for
 * this: everything except the router.
 */
export function render(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const errors = []

    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>,
      {
        onAllReady() {
          const sink = new Writable({
            write(chunk, _enc, cb) { chunks.push(Buffer.from(chunk)); cb() },
          })
          /* joinStreamChunks, not Buffer.concat: react-dom 18.3.1 can end a
             written chunk with one unused 0x00 byte when the next character
             is multi-byte -- seen here as "Tg: 55\u0000°C" in hardware.html,
             and reproduced from clean input by
             scripts/repro-react-stream-nul.mjs. Left in, it is a hydration
             text mismatch, and React 18 recovers from that by discarding the
             prerendered DOM. Only that exact byte pattern is dropped; any
             other NUL survives to fail tests/prerender.test.mjs. */
          sink.on('finish', () => resolve({ html: joinStreamChunks(chunks), errors }))
          stream.pipe(sink)
        },
        /* onError fires for errors React RECOVERS from as well as fatal ones,
           so it records rather than rejects. A route that throws inside a
           Suspense boundary still produces a shell, and silently shipping that
           half-rendered page is exactly what the caller needs to know about --
           hence the errors array comes back with the html. */
        onError(err) { errors.push(String(err?.stack || err)) },
        onShellError(err) { reject(err) },
      },
    )
  })
}
