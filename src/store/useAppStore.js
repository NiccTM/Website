/**
 * Global Zustand store.
 *
 * Slices:
 *   terminal  — command history ring buffer (50 entries)
 *   bpm       — global BPM state (used by PCB Lab trace pulse)
 *   rpm       — disc playback speed (migrated from UIContext)
 *   hardware  — gallery active index + one-shot PCB camera commands
 */
import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // ── Terminal history ──────────────────────────────────────────────────────
  terminalHistory: [],   // [{ cmd, output }]  newest last
  commandRing: [],       // raw command strings for ↑/↓ recall, newest first

  pushCommand: (cmd) =>
    set((s) => {
      const ring = s.commandRing
      if (!cmd || ring[0] === cmd) return {}
      return { commandRing: [cmd, ...ring].slice(0, 50) }
    }),

  pushHistory: (entry) =>
    set((s) => ({ terminalHistory: [...s.terminalHistory, entry] })),

  clearHistory: () => set({ terminalHistory: [] }),

  // ── BPM ──────────────────────────────────────────────────────────────────
  bpm: 72,
  setBpm: (bpm) => set({ bpm }),

  // ── RPM (vinyl disc) ─────────────────────────────────────────────────────
  rpm: 33.333,
  setRpm: (rpm) => set({ rpm }),

  // ── Hardware Lab ─────────────────────────────────────────────────────────
  // galleryIndex : which reference image is active (0-based)
  // pcbCommand   : one-shot string consumed by CameraController ('reset'|'topdown'|null)
  // pcbXray      : X-Ray (transparent board) mode — settable from terminal or UI
  galleryIndex: 0,
  pcbCommand:   null,
  pcbXray:      false,
  setGalleryIndex: (i) => set({ galleryIndex: i }),
  nextGallery:     ()  => set((s) => ({ galleryIndex: (s.galleryIndex + 1) % 5 })),
  setPcbCommand:   (c) => set({ pcbCommand: c }),
  setPcbXray:      (v) => set({ pcbXray: v }),

  // ── Overclock easter egg ──────────────────────────────────────────────────
  overclock: false,
  setOverclock: (v) => set({ overclock: v }),

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
