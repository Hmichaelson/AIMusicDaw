/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DAW-specific dark theme colors
        'daw': {
          'bg': '#1a1a1a',
          'surface': '#242424',
          'surface-light': '#2d2d2d',
          'surface-lighter': '#363636',
          'border': '#3d3d3d',
          'text': '#e0e0e0',
          'text-muted': '#888888',
          'accent': '#4a9eff',
          'accent-hover': '#6bb3ff',
          'success': '#4ade80',
          'warning': '#fbbf24',
          'error': '#f87171',
          'track-1': '#ef4444',
          'track-2': '#f97316',
          'track-3': '#eab308',
          'track-4': '#22c55e',
          'track-5': '#06b6d4',
          'track-6': '#3b82f6',
          'track-7': '#8b5cf6',
          'track-8': '#ec4899',
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
