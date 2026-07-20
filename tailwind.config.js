/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'bg-main': '#0B0B0B',
        'panel-dark': '#1A1A1A',
        'card-bg': '#1B1B1B',
        'border': '#2A2A2A',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9A9A9A',
        'accent-yellow': '#FFD100',
        'danger-red': '#FF4D4D',
        'verified-blue': '#4DA3FF',
      },
    },
  },
  plugins: [],
}
