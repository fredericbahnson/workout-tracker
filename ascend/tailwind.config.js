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
        // Custom colors for the app
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Industry-standard dark mode colors
        dark: {
          bg: '#121212',           // Primary background
          surface: '#1A1A2E',      // Elevated surfaces (cards, modals)
          elevated: '#252538',     // Higher elevation surfaces
          border: '#2D2D4A',       // Border color for dark mode
          'border-hover': '#3D3D5A', // Border hover state
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Extra small text (10px) for badges and labels
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        // Gym-readable font sizes (24-32pt for active workout)
        'gym-xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],      // 24px
        'gym-2xl': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }], // 28px
        'gym-3xl': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],     // 32px
      }
    },
  },
  plugins: [],
}
