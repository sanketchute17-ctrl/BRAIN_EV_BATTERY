/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brain: {
          white: '#FFFFFF',
          bg: '#F8FAFC',
          lightBg: '#F1F5F9',
          card: '#FFFFFF',
          border: '#E2E8F0',
          darkBorder: '#CBD5E1',
          text: '#0F172A',
          subtext: '#475569',
          muted: '#64748B',
          black: '#0F172A',
          charcoal: '#FFFFFF',
          navy: '#F1F5F9',
          green: '#10B981',  // Ola/Ather Emerald Green
          red: '#EF4444',    // Electric Red
        },
        electric: {
          green: '#10B981',  // Ola/Ather Emerald Green
          red: '#EF4444',    // Electric Red
          lightGreen: '#059669',
          lightRed: '#DC2626',
          darkGreen: '#047857',
        }
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        'card': '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(226, 232, 240, 0.8)',
        'emerald': '0 4px 20px rgba(16, 185, 129, 0.25)',
        'red': '0 4px 20px rgba(239, 68, 68, 0.25)',
        'neon-green': '0 4px 20px rgba(16, 185, 129, 0.3)',
        'neon-red': '0 4px 20px rgba(239, 68, 68, 0.3)',
        'glass': '0 8px 30px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
