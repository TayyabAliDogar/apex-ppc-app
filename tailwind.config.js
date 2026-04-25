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
        // Professional Dark Theme Color System
        dark: {
          page: '#0D1826',
          card: '#112031',
          topbar: '#0B1220',
          hero: '#091525',
          input: '#0B1220',
        },
        border: {
          default: '#1E3048',
          subtle: '#1A2E42',
          sidebar: '#1E2D3D',
        },
        sidebar: {
          bg: '#0B1220',
          brand: '#F1F5F9',
          subtitle: '#3D5166',
          navDefault: '#3D5166',
          navActive: '#10B981',
          navActiveBg: '#132032',
          aiBadgeBg: '#0D1B2A',
          aiBadgeBorder: '#1A2E42',
          aiBadgeLabel: '#4B6278',
          aiFill: '#6366F1',
          exportBg: '#0D1B2A',
          exportBorder: '#1A2E42',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
          disabled: '#475569',
        },
        // Keep existing for compatibility
        obsidian: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
