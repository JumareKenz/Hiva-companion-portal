import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './stores/**/*.{js,ts,jsx,tsx,mdx}',
    './services/**/*.{js,ts,jsx,tsx,mdx}',
    './types/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Accent — Deep Teal
        accent: {
          50: '#e6f3ef',
          100: '#b3ddd2',
          200: '#80c7b5',
          300: '#4db198',
          400: '#269b7e',
          500: '#1a7056',
          600: '#155D46',
          700: '#114a38',
          800: '#0e3d2f',
          900: '#0a2e23',
        },
        // Brand tan
        'brand-tan': '#C9A96E',
        // Warm stone neutrals
        n: {
          0: '#ffffff',
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Semantic
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(28,25,23,0.04)',
        sm: '0 1px 3px 0 rgba(28,25,23,0.06), 0 1px 2px -1px rgba(28,25,23,0.04)',
        md: '0 4px 6px -1px rgba(28,25,23,0.05), 0 2px 4px -2px rgba(28,25,23,0.03)',
        lg: '0 10px 15px -3px rgba(28,25,23,0.06), 0 4px 6px -4px rgba(28,25,23,0.03)',
        xl: '0 20px 25px -5px rgba(28,25,23,0.07), 0 8px 10px -6px rgba(28,25,23,0.04)',
        glow: '0 0 20px rgba(21,93,70,0.15)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
