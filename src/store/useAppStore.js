/**
 * Global Zustand store.
 *
 * Slices:
 *   bpm       — global BPM state (used by PCB Lab trace pulse)
 *   hardware  — gallery active index + one-shot PCB camera commands
 *   theme     — dark/light, persisted to localStorage
 */
import { create } from 'zustand'

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

  // ── Theme ─────────────────────────────────────────────────────────────────
  // dark is the default; light activates Dreamcore pastels
  darkMode: typeof window !== 'undefined'
    ? window.localStorage.getItem('theme') !== 'light'
    : true,
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode
      try { window.localStorage.setItem('theme', next ? 'dark' : 'light') } catch (_) {}
      return { darkMode: next }
    }),
}))
