/**
 * Global Zustand store.
 *
 * Slices:
 *   bpm       -- global BPM state (used by PCB Lab trace pulse)
 *   hardware  -- gallery active index + one-shot PCB camera commands
 *   theme     -- dark/light, persisted to localStorage
 */
import { create } from 'zustand'
import { initialDarkMode } from './theme'

export const useAppStore = create((set) => ({
  // ── BPM ──────────────────────────────────────────────────────────────────
  bpm: 72,
  setBpm: (bpm) => set({ bpm }),

  // ── Hardware Lab ─────────────────────────────────────────────────────────
  // galleryIndex : which reference image is active (0-based)
  // pcbCommand   : one-shot string consumed by CameraController ('reset'|'topdown'|null)
  // pcbXray      : X-Ray (transparent board) mode
  galleryIndex: 0,
  pcbCommand:   null,
  pcbXray:      false,
  setGalleryIndex: (i) => set({ galleryIndex: i }),
  setPcbCommand:   (c) => set({ pcbCommand: c }),
  setPcbXray:      (v) => set({ pcbXray: v }),

  // ── Display mode ──────────────────────────────────────────────────────────
  // LAB (light) is the default; NIGHT (dark) is opt-in. See store/theme.js.
  darkMode: (() => {
    try { return initialDarkMode(window.localStorage.getItem('theme')) } catch (_) { return false }
  })(),
  setDarkMode: (next) => {
    try { window.localStorage.setItem('theme', next ? 'dark' : 'light') } catch (_) {}
    set({ darkMode: next })
  },
}))
