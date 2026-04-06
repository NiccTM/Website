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

      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },

      fontFamily: {
        sans:    ['"Exo 2"', '"Segoe UI"', 'Tahoma', 'system-ui', 'sans-serif'],
        mono:    ['"Exo 2"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },

      colors: {
        surface: {
          DEFAULT: '#111111',
          1: '#1a1a1a',
          2: '#242424',
          3: '#2e2e2e',
        },
        accent: {
          DEFAULT: '#58b8e0',
          dim: '#3a90b8',
        },
        crimson: '#FF3B30',
      },
    },
  },
  plugins: [],
}
