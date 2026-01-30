import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E94E35',
          hover: '#D4432E',
          light: '#FEE8E4',
        },
        secondary: {
          DEFAULT: '#2B2D5E',
          hover: '#1F2148',
          light: '#E8E8F0',
        },
        cream: {
          DEFAULT: '#F5E6DC',
          light: '#FAF3EE',
          dark: '#E8D5C8',
        },
        pending: {
          bg: '#FEF3C7',
          text: '#92400E',
        },
        scheduled: {
          bg: '#DBEAFE',
          text: '#1E40AF',
        },
        completed: {
          bg: '#D1FAE5',
          text: '#065F46',
        },
        canceled: {
          bg: '#FEE2E2',
          text: '#991B1B',
        },
      },
    },
  },
  plugins: [],
}
export default config
