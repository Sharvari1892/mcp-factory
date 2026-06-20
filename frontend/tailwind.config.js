/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-end aesthetic dark theme color variables
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d5dde8',
          300: '#b4c3d6',
          400: '#8ca3be',
          500: '#6983a5',
          600: '#526a8d',
          700: '#435674',
          800: '#39475f',
          950: '#0f172a', // sleek dark slate
        }
      }
    },
  },
  plugins: [],
}
