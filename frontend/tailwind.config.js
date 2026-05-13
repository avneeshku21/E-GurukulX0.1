import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html').replace(/\\/g, '/'),
    path.join(__dirname, 'src/**/*.{js,jsx}').replace(/\\/g, '/'),
  ],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50:  '#EEEDFD',
          100: '#D9D7FB',
          200: '#B5B1F8',
          300: '#918BF4',
          400: '#6D65F1',
          500: '#4F46E5',
          600: '#3730C2',
          700: '#2A2499',
          800: '#1D1870',
          900: '#100D47',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          50:  '#F3EFFE',
          100: '#E8DFFD',
          200: '#D0BFFB',
          300: '#B99FF9',
          400: '#A17FF7',
          500: '#8B5CF6',
          600: '#6D31F2',
          700: '#5116DB',
          800: '#3D11A6',
          900: '#290B71',
        },
        success: {
          DEFAULT: '#10B981',
          50:  '#ECFDF5',
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
        warning: {
          DEFAULT: '#F59E0B',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          DEFAULT: '#EF4444',
          50:  '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          DEFAULT: '#3B82F6',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.4s ease-in-out forwards',
        'slide-up':   'slideUp 0.4s ease-out forwards',
        'shimmer':    'shimmer 1.5s infinite linear',
        'spin-slow':  'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },

      backgroundImage: {
        'shimmer-gradient':
          'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)',
      },

      boxShadow: {
        'glow-primary':   '0 0 20px rgba(79, 70, 229, 0.35)',
        'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.35)',
        'card':           '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':     '0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)',
      },

      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      screens: {
        'xs': '480px',
      },
    },
  },

  plugins: [
    // @tailwindcss/typography — install separately if needed
    // require('@tailwindcss/typography'),
  ],
};
