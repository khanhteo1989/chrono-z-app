/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chrono-mint': '#00F5D4',
        'chrono-purple': '#7B2CBF',
        'chrono-dark': '#0A0A12', // Deep Space Background
        'chrono-neon': '#3B82F6', // Neon Blue
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-mint': '0 0 15px rgba(0, 245, 212, 0.5)',
        'neon-purple': '0 0 15px rgba(123, 44, 191, 0.5)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
