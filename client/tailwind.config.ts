import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008080',
          dark: '#006666',
          light: '#00A0A0',
        },
        secondary: {
          DEFAULT: '#ADD8E6',
          dark: '#87CEEB',
        },
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: {
          primary: '#333333',
          secondary: '#777777',
        },
        success: '#228B22',
        warning: '#FFA500',
        danger: '#DC143C',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
