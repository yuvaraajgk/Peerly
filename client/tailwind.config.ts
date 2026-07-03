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
          DEFAULT: '#4338CA',
          dark: '#362E9E',
          light: '#6366F1',
        },
        secondary: {
          DEFAULT: '#EEF2FF',
          dark: '#E0E1FA',
        },
        background: '#FFFFFF',
        surface: '#F6F6FB',
        text: {
          primary: '#1E1B3A',
          secondary: '#5D5A82',
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
