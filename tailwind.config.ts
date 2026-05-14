import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#48C9B0',
        'primary-deep': '#2EAB95',
        accent: '#7FE3D3',
        light: '#F7FEFE',
        mint: '#E8FFFB',
        dark: '#14201E',
        'dark-soft': '#1F2D2B',
        gray: '#6B7B78',
        'gray-soft': '#9BA8A6',
        line: '#E1ECEA',
        lavender: '#F0E5FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 6px 18px rgba(20, 32, 30, 0.06)',
        glow: '0 12px 32px rgba(72, 201, 176, 0.22)',
      },
      maxWidth: {
        prose: '65ch',
      },
    },
  },
  plugins: [],
}

export default config
