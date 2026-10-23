import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialDarkMode } from '../src/store/theme.js'

/* LAB (data-theme="light") is the default look of the redesign; NIGHT is the
   stored opt-in. Stored values stay 'light' | 'dark' so a returning visitor's
   existing preference still applies. */
test('LAB (light) is the default when nothing is stored', () => {
  assert.equal(initialDarkMode(null), false)
})
test('a stored dark preference is honoured', () => {
  assert.equal(initialDarkMode('dark'), true)
})
test('a stored light preference is honoured', () => {
  assert.equal(initialDarkMode('light'), false)
})
test('junk values fall back to LAB', () => {
  assert.equal(initialDarkMode('purple'), false)
})
