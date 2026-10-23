#!/usr/bin/env node
/**
 * Standalone reproduction: react-dom/server renderToPipeableStream emitting a
 * stray U+0000 from CLEAN input.
 *
 * Every string rendered here is plain ASCII padding plus one fixed line of
 * clean UTF-8 text ("Tg: 55°C → 70°C µΩ±"), checked below to contain no NUL.
 * The tree is rendered once per padding size so that the multi-byte
 * characters sweep across the stream's internal buffer boundaries. For every
 * render it records the byte offsets of the chunks React writes, and compares
 * the streamed HTML with renderToString of the same tree.
 *
 * It answers three questions about src/entry-server.jsx's workaround:
 *   1. Does React emit NUL from clean input?            (is it upstream?)
 *   2. Is stripping NUL byte-identical to renderToString? (is it lossless?)
 *   3. Where exactly does each NUL sit?                  (how narrow can it be?)
 *
 * Exit code 0 always; it reports. Remove the workaround when "renders with a
 * NUL" reads 0 on the installed react-dom.
 *
 * Usage: node scripts/repro-react-stream-nul.mjs
 */
import { Writable } from 'node:stream'
import { createRequire } from 'node:module'
import { createElement as h } from 'react'
import { renderToPipeableStream, renderToString } from 'react-dom/server'
import { joinStreamChunks } from '../src/ssr/joinStreamChunks.js'

const require = createRequire(import.meta.url)
const version = require('react-dom/package.json').version

const LINE = 'Tg: 55°C → 70°C µΩ±'
if (LINE.includes('\u0000')) throw new Error('input is not clean')

const tree = (n, extra) => h('div', null,
  ...Array.from({ length: n }, (_, i) => h('i', { key: i }, 'ab')),
  h('b', null, 'q'.repeat(extra)),
  h('p', null, LINE))

/* Collect exactly as src/entry-server.jsx does: Buffer.from(chunk) per write,
   concatenated, decoded once. */
const stream = (t) => new Promise((resolve) => {
  const chunks = []
  const s = renderToPipeableStream(t, {
    onAllReady() {
      const sink = new Writable({ write(c, _e, cb) { chunks.push(Buffer.from(c)); cb() } })
      sink.on('finish', () => resolve(chunks))
      s.pipe(sink)
    },
  })
})

let renders = 0, withNul = 0, strippedEqual = 0, narrowEqual = 0, nulsTotal = 0, nulsInPaddingRuns = 0
const runs = []
for (let n = 210; n < 240; n++) {
  for (let extra = 0; extra < 10; extra++) {
    renders++
    const t = tree(n, extra)
    const chunks = await stream(t)
    const buf = Buffer.concat(chunks)
    const html = buf.toString('utf8')
    if (!html.includes('\u0000')) continue
    withNul++
    if (html.replace(/\u0000/g, '') === renderToString(t)) strippedEqual++
    if (joinStreamChunks(chunks) === renderToString(t)) narrowEqual++
    // Where are the NULs? Count all of them, then the ones that form a run of
    // trailing zeros at the END of a written chunk whose next chunk starts
    // with a multi-byte character -- and record that run's shape.
    nulsTotal += buf.filter((x) => x === 0).length
    let off = 0
    chunks.forEach((c, i) => {
      off += c.length
      const next = chunks[i + 1]
      let k = 0
      while (k < c.length && c[c.length - 1 - k] === 0) k++
      if (!k || !next) return
      const lead = next[0]
      const width = lead >= 0xf0 ? 4 : lead >= 0xe0 ? 3 : lead >= 0xc0 ? 2 : 1
      nulsInPaddingRuns += k
      runs.push(`${k} zero byte(s) ending at byte ${off - 1} (chunk of ${c.length}), next char ${width} bytes: ${JSON.stringify(next.subarray(0, width).toString('utf8'))}`)
    })
  }
}
console.log(`react-dom ${version}`)
console.log(`renders: ${renders} | renders with a NUL: ${withNul}`)
console.log(`strip-all output byte-identical to renderToString: ${strippedEqual}/${withNul} | joinStreamChunks (exact rule) byte-identical: ${narrowEqual}/${withNul}`)
console.log(`NUL bytes: ${nulsTotal} | of which in a trailing run before a multi-byte char: ${nulsInPaddingRuns}`)
for (const r of runs) console.log('  ' + r)
