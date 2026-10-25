/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ── TV / ultrawide breakpoint ──────────────────────────────────────────
      screens: {
        'tv': '2560px',
      },

      // ── Base size overrides — more readable than Tailwind defaults ────────
      fontSize: {
        'xs':  ['0.875rem', { lineHeight: '1.55', letterSpacing: '0.02em' }],
        'sm':  ['0.95rem',  { lineHeight: '1.6',  letterSpacing: '0.015em' }],
        'base':['1.05rem',  { lineHeight: '1.75', letterSpacing: '0.01em' }],

        // ── Fluid typography — clamp(min, preferred, max) ─────────────────
        'fluid-xs':   ['clamp(0.825rem, 0.78rem + 0.2vw, 0.95rem)',  { lineHeight: '1.55' }],
        'fluid-sm':   ['clamp(0.9rem, 0.85rem + 0.3vw, 1.05rem)',    { lineHeight: '1.6'  }],
        'fluid-base': ['clamp(0.95rem, 0.88rem + 0.35vw, 1.1rem)',   { lineHeight: '1.75' }],
        'fluid-lg':   ['clamp(1.05rem, 0.95rem + 0.45vw, 1.3rem)',   { lineHeight: '1.6'  }],
        'fluid-xl':   ['clamp(1.2rem, 1.05rem + 0.6vw, 1.55rem)',    { lineHeight: '1.45' }],
        'fluid-2xl':  ['clamp(1.45rem, 1.25rem + 0.9vw, 2.15rem)',   { lineHeight: '1.3'  }],
        'fluid-3xl':  ['clamp(2rem, 1.6rem + 1.5vw, 3.5rem)',        { lineHeight: '1.15' }],
        'fluid-4xl':  ['clamp(2.5rem, 2rem + 2.2vw, 5.25rem)',       { lineHeight: '1.05' }],
        'fluid-hero': ['clamp(3.25rem, 2.5rem + 3vw, 7.5rem)',       { lineHeight: '0.95' }],
      },

      // ── Spacing ────────────────────────────────────────────────────────────
      maxWidth: {
        'content': '1600px',
        'tv':      '2400px',
      },

      // Moulded-instrument radii: small, never zero. Every rounded-xl card and
      // rounded-lg control on the site picks these up without being touched.
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '3px',
        lg: '3px',
        xl: '4px',
        '2xl': '8px',
      },

      // Roles (see docs/redesign/CASSETTE-DESIGN-CONTRACT.md):
      //   sans    -- body copy: the platform grotesk, no download
      //   display -- headings: Archivo at full width
      //   legend  -- Archivo condensed, short uppercase legends only (the
      //              .legend class also sets the width; this token does not)
      //   mono    -- genuine fixed-pitch, for readouts
      // Keep display/legend in step with --font-grotesk / --font-legend in
      // index.css: this utility outranks the .font-display component rule.
      // The symbol families cover µ Ω ± ≈ → and subscripts on every platform.
      fontFamily: {
        sans:    ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Segoe UI Symbol"', '"Apple Symbols"', '"Noto Sans Symbols 2"', 'sans-serif'],
        display: ['Archivo', '"Archivo Fallback"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        legend:  ['Archivo', '"Archivo Legend Fallback"', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', '"Cascadia Mono"', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },

    },
  },
  plugins: [],
}
