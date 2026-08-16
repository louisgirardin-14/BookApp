import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f6f1e7',
        ink: '#2a2622',
        kraft: '#b08d57',
      },
    },
  },
  plugins: [],
};

export default config;
