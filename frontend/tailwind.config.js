/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom palette aliases — usable in JSX className but NOT in @apply
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4bcfd',
          400: '#7a97fa',
          500: '#5570f5',
          600: '#3d4eea',
          700: '#3038d6',
          800: '#2b2fad',
          900: '#282d88',
          950: '#1a1d52',
        },
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: {
          50:  '#f0fdf4',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50:  '#fefce8',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        danger: {
          50:  '#fef2f2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px 0 rgba(85,112,245,0.15)',
        glow: '0 0 20px rgba(85,112,245,0.35)',
      },
    },
  },
  plugins: [],
};
