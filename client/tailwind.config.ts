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
          DEFAULT: '#0F7A6E',
          dark: '#0B5E55',
          light: '#14B8A6',
        },
        secondary: {
          DEFAULT: '#E7F5F2',
          dark: '#CFEAE4',
        },
        background: '#FFFFFF',
        surface: '#F7F8FA',
        text: {
          primary: '#111827',
          secondary: '#5B6472',
        },
        success: '#1A7F4E',
        warning: '#B4690A',
        danger: '#B42318',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
