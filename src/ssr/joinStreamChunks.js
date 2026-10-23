/**
 * Joins the byte chunks written by react-dom/server's renderToPipeableStream
 * into a UTF-8 string, dropping ONE specific artefact of react-dom 18.3.1.
 *
 * React writes through a fixed 2048-byte buffer. When the next character is
 * multi-byte (°, µ, Ω, →) and does not fit in the space left, the buffer is
 * flushed with its unused trailing byte still 0x00, and the character starts
 * the next chunk. Reproduced from clean input by
 * scripts/repro-react-stream-nul.mjs: every NUL found was the LAST byte of a
 * written chunk and was immediately followed by a byte >= 0x80, and dropping
 * it made the stream byte-identical to renderToString.
 *
 * The padding is however much room was left -- one or more bytes, but always
 * FEWER than the UTF-8 length of the character that did not fit (the repro
 * found two zero bytes before a 3-byte "→"). So exactly that is dropped: k
 * trailing 0x00 bytes at the end of a chunk, where the next chunk begins with
 * a UTF-8 lead byte of an n-byte character and 1 <= k < n. Any other NUL is
 * kept, so a NUL that came from content still reaches dist/ and fails
 * tests/prerender.test.mjs rather than being silently repaired.
 *
 * Remove when scripts/repro-react-stream-nul.mjs reports 0 renders with a NUL
 * on the installed react-dom.
 */
const utf8Length = (lead) =>
  lead >= 0xf0 && lead <= 0xf7 ? 4 : lead >= 0xe0 ? 3 : lead >= 0xc0 ? 2 : 0

export function joinStreamChunks(chunks) {
  const parts = chunks.map((c, i) => {
    const next = chunks[i + 1]
    const n = next && next.length > 0 ? utf8Length(next[0]) : 0
    if (n === 0) return c
    let k = 0
    while (k < c.length && c[c.length - 1 - k] === 0x00) k++
    return k >= 1 && k < n ? c.subarray(0, c.length - k) : c
  })
  return Buffer.concat(parts).toString('utf8')
}
