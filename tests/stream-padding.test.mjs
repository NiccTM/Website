import { test } from 'node:test'
import assert from 'node:assert/strict'
import { joinStreamChunks } from '../src/ssr/joinStreamChunks.js'

/* React 18.3.1 can end a written chunk with one unused 0x00 byte when the
   next character is multi-byte and did not fit (scripts/repro-react-stream-nul.mjs).
   joinStreamChunks drops ONLY that signature; any other NUL is left in place so
   the prerender test can catch it instead of it being silently repaired. */
const b = (...bytes) => Buffer.from(bytes)
const deg = [0xc2, 0xb0] // °

test('drops a 0x00 that ends a chunk when the next chunk starts with a multi-byte character', () => {
  assert.equal(joinStreamChunks([b(0x35, 0x35, 0x00), b(...deg, 0x43)]), '55°C')
})

test('keeps a 0x00 that is not the last byte of a chunk', () => {
  assert.equal(joinStreamChunks([b(0x35, 0x00, 0x35), b(...deg)]), '5\u00005°')
})

test('keeps a chunk-ending 0x00 when the next chunk starts with ASCII', () => {
  assert.equal(joinStreamChunks([b(0x41, 0x00), b(0x42)]), 'A\u0000B')
})

test('keeps a 0x00 at the very end of the stream', () => {
  assert.equal(joinStreamChunks([b(0x41), b(0x42, 0x00)]), 'AB\u0000')
})

test('passes clean multi-byte text through unchanged, including across chunk joins', () => {
  assert.equal(joinStreamChunks([b(0x54, 0x67, 0x3a, 0x20, 0x35, 0x35), b(...deg, 0x43)]), 'Tg: 55°C')
})

/* The padding is not always one byte: it is however much room was left, which
   is fewer bytes than the character that did not fit. Found by the repro
   (react-dom 18.3.1, n=224 extra=5): two 0x00 bytes before a 3-byte "→". */
const arrow = [0xe2, 0x86, 0x92] // →

test('drops two padding bytes before a 3-byte character', () => {
  assert.equal(joinStreamChunks([b(0x43, 0x20, 0x00, 0x00), b(...arrow, 0x20)]), 'C → ')
})

test('keeps zero bytes that could not be padding for the next character', () => {
  // A 2-byte character needs at most one padding byte; two zeros are not that.
  assert.equal(joinStreamChunks([b(0x41, 0x00, 0x00), b(...deg)]), 'A\u0000\u0000°')
})
