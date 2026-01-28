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
          DEFAULT: '#F97316',
          hover: '#EA580C',
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
