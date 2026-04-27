/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf6',
          100: '#d6f8e8',
          200: '#aef0d2',
          300: '#76e3b5',
          400: '#3fcd92',
          500: '#1ab277',
          600: '#0f8e5f',
          700: '#0d714e',
          800: '#0d5a40',
          900: '#0b4936',
          950: '#062a20',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
