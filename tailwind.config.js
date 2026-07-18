/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Libre Baskerville drives every header (H1–H3, app title, agent names).
        serif: ['"Libre Baskerville"', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        display: ['"Libre Baskerville"', 'ui-serif', 'Georgia', 'serif'],
        // Body / UI uses the native system stack (Manus aesthetic).
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Manus design tokens (repurposed so existing utilities remap cleanly).
        ink: '#1A1A19', // near-black — body text & primary surfaces (light)
        navy: '#1A1A19', // headings (light) / used as dark canvas base
        cloud: '#E5E7EB', // hairline borders (light) / body text (dark)
        canvas: '#F8F8F7', // global off-white canvas (light)
        line: '#E5E7EB', // card hairline border (light)
      },
      borderRadius: {
        // Manus cards/panes use an 8px radius (flat, minimal).
        glass: '8px',
      },
      boxShadow: {
        // Manus is flat — no soft glass shadow.
        glass: 'none',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
