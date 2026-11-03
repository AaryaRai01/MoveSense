/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090909',
        panel: '#141414',
        'panel-2': '#1D1D1D',
        'panel-3': '#252525',
        border: '#3A3A3A',
        'border-soft': '#292929',
        sage: '#D8D8D8',
        'sage-dim': '#929292',
        'sage-bright': '#FFFFFF',
        amber: '#F28C28',
        'amber-soft': '#FFB45C',
        'amber-dim': '#B85E16',
        rust: '#E05245',
        moss: '#6E8F63',
        clay: '#E6E6E6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px #283326',
        glow: '0 0 24px rgba(242,140,40,0.08)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
