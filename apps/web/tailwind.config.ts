import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#EEF5FF',
          100: '#D9EBFF',
          200: '#BCDAFF',
          300: '#8EC0FF',
          400: '#5A9EF8',
          500: '#267EF0', // brand blue
          600: '#1A6BD4',
          700: '#1456B0',
          800: '#0E3E87',
          900: '#0B2E6B',
          950: '#071A46',
        },
        accent: {
          DEFAULT: '#0D0DF0', // brand deep electric blue
          hover:   '#0B0BD6',
        },
        navy: {
          900: '#070D1A',
          800: '#0A1020',
          700: '#0E1629',
          600: '#141E35',
          500: '#1C2845',
          400: '#253358',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card:    '#FFFFFF',
          muted:   '#F1F5F9',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong:  '#CBD5E1',
        },
        text: {
          primary:   '#0F172A',
          secondary: '#475569',
          muted:     '#94A3B8',
          inverse:   '#FFFFFF',
        },
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2' },
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
        dropdown: '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};

export default config;
