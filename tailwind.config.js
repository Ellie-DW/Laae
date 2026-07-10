/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        display: ['"Orbitron"', 'system-ui', 'sans-serif'],
      },
      colors: {
        maple: {
          50: '#fff8e7',
          100: '#ffefc2',
          200: '#ffe08a',
          300: '#ffc94d',
          400: '#ffb020',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        cyber: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        dark: {
          bg: '#06080f',
          surface: '#0c1018',
          panel: '#111827',
          border: '#1e293b',
          muted: '#64748b',
        },
        meso: {
          gold: '#ffd700',
          dark: '#1a1a2e',
          panel: '#16213e',
          border: '#0f3460',
        },
      },
      boxShadow: {
        maple: '0 4px 20px rgba(245, 158, 11, 0.25)',
        panel: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5)',
        neon: '0 0 20px rgba(34, 211, 238, 0.15), 0 0 40px rgba(34, 211, 238, 0.05)',
        'neon-sm': '0 0 12px rgba(34, 211, 238, 0.2)',
        glow: '0 0 30px rgba(34, 211, 238, 0.1)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
    },
  },
  plugins: [],
}
