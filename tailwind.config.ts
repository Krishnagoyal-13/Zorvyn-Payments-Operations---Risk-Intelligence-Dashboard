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
        card: '0 14px 34px -18px rgba(15, 23, 42, 0.35), 0 2px 8px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
};

export default config;
