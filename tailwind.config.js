/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#08090C",
        surface: "#10131A",
        surfaceLight: "#161B26",
        amberGlow: "#F59E0B",
        twilight: "#6366F1",
        terminalGreen: "#10B981"
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
        sans: ['Geist', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}