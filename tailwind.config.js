/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090E',
          900: '#0B0E14',
          850: '#0F131D',
          800: '#141A26',
          750: '#1A2232',
          700: '#222D42',
          600: '#334155',
        },
        trade: {
          green: '#10B981',
          'green-light': '#34D399',
          'green-glow': 'rgba(16, 185, 129, 0.15)',
          red: '#F43F5E',
          'red-light': '#FB7185',
          'red-glow': 'rgba(244, 63, 94, 0.15)',
          cyan: '#06B6D4',
          blue: '#3B82F6',
          indigo: '#6366F1',
          gold: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px -5px rgba(244, 63, 94, 0.3)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'card-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
