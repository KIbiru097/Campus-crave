/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
        },
        espresso: '#120D0A',
        'espresso-elevated': '#1A1410',
        honey: '#F59E0B',
        leaf: '#84CC16',
        ivory: '#FFF8F0',
        muted: '#B8ADA4',
        dim: '#6B5E52',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'card': '28px',
        'card-sm': '20px',
        'card-xs': '14px',
      },
      colors: {
        glass: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.1)',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.35)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.5)',
        'glow': '0 0 24px rgba(217,119,6,0.2)',
        'glow-lg': '0 0 48px rgba(217,119,6,0.3)',
      },
      backdropBlur: {
        'glass': '28px',
      },
      animation: {
        'drift': 'drift 25s ease-in-out infinite alternate',
        'drift-reverse': 'drift 20s ease-in-out infinite alternate-reverse',
        'shimmer': 'shimmer 6s ease-in-out infinite',
        'float': 'float 7s ease-in-out infinite',
        'bean-float': 'beanFloat 12s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(30px,-20px) scale(1.1)' },
          '100%': { transform: 'translate(-15px,25px) scale(0.95)' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) rotate(6deg) scale(1.08)' },
        },
        beanFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0)' },
          '25%': { transform: 'translateY(-14px) rotate(10deg)' },
          '50%': { transform: 'translateY(-8px) rotate(-5deg)' },
          '75%': { transform: 'translateY(-18px) rotate(8deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(217,119,6,0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(217,119,6,0.55)' },
        },
      },
    },
  },
  plugins: [],
}
