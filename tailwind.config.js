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
        'chrono-dark': '#1A1A2E',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'Outfit', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
