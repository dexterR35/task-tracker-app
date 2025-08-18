// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}', // This line ensures all your source files are scanned.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};