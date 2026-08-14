/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, light "paper" palette with a soft yellow accent.
        paper: '#F4F0E7', // page background
        cream: '#FBF8F1', // secondary surface
        surface: '#FFFFFF', // cards
        ink: { DEFAULT: '#1C1C1E', 700: '#2A2A2E' }, // near-black (text, dark buttons)
        // The old dark-theme token names are remapped to light values so every
        // existing bg-base-* / ring-base-* usage becomes light automatically.
        base: {
          900: '#FFFFFF',
          800: '#F4F0E7',
          700: '#FFFFFF',
          600: '#FFFFFF',
          500: '#E7E1D4',
        },
        accent: {
          DEFAULT: '#F5C24B', // soft mustard yellow
          soft: '#FBE7A8',
          glow: '#F5C24B',
          deep: '#E0A32B',
        },
        good: '#16a34a',
        warn: '#d97706',
        bad: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 10px 30px -8px rgba(245, 194, 75, 0.55)',
        card: '0 12px 32px -16px rgba(28, 28, 30, 0.18)',
        soft: '0 2px 10px -4px rgba(28, 28, 30, 0.10)',
      },
      backgroundImage: {
        'accent-glow':
          'radial-gradient(circle at 50% 0%, rgba(245,194,75,0.28), transparent 70%)',
      },
    },
  },
  plugins: [],
}
