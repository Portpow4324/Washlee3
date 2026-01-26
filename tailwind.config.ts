import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#48C9B0',      // Teal
        light: '#f7fefe',        // Light backgrounds
        dark: '#1f2d2b',         // Dark text
        gray: '#6b7b78',         // Secondary text
        mint: '#E8FFFB',         // Mint background
        lavender: '#F0E5FF',     // Lavender accent
        accent: '#7FE3D3',       // Lighter teal
      },
      borderRadius: {
        'xl': '16px',
        'full': '999px',
      },
    },
  },
  plugins: [],
}

export default config
