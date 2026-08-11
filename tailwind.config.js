/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy / near-black base
        base: {
          900: '#05070f', // near black
          800: '#0a0e1a', // page background
          700: '#0f1424', // panel background
          600: '#161c30', // raised card
          500: '#1e2740', // borders / hover
        },
        // Single electric accent
        accent: {
          DEFAULT: '#5b8cff',
          soft: '#7aa2ff',
          glow: '#3d6bff',
        },
        good: '#34d399',
        warn: '#fbbf24',
        bad: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(91, 140, 255, 0.45)',
        card: '0 8px 30px -12px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'accent-glow':
          'radial-gradient(circle at 50% 0%, rgba(91,140,255,0.18), transparent 70%)',
      },
    },
  },
  plugins: [],
}
