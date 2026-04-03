import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1f7ae0',
          700: '#1157a6',
          900: '#0d2a4f'
        }
      },
      boxShadow: {
        card: '0 8px 26px rgba(16, 24, 40, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
