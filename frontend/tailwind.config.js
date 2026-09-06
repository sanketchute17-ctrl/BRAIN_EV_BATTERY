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
          black: '#07090E',
          charcoal: '#0F1420',
          navy: '#131A2B',
          card: '#182238',
          border: '#2A3854',
          green: '#00FF87',  // Electric Light Green
          red: '#FF2A55',    // Electric Light Red
          cyan: '#00FF87',
          yellow: '#00FF87',
          orange: '#FF2A55',
          muted: '#A0AEC0',
        },
        electric: {
          green: '#00FF87',  // Electric Light Neon Green
          red: '#FF2A55',    // Electric Light Neon Red
          lightGreen: '#00FF87',
          lightRed: '#FF2A55',
        }
      },
      fontFamily: {
        heading: ['Rajdhani', 'Outfit', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 135, 0.65)',
        'neon-red': '0 0 20px rgba(255, 42, 85, 0.65)',
        'neon-cyan': '0 0 20px rgba(0, 255, 135, 0.65)',
        'neon-yellow': '0 0 20px rgba(0, 255, 135, 0.65)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
