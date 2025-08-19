// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',  // Ensure all source files are included
  ],
  theme: {
    extend: {
      colors: {
        primary: '#141C33', // Custom primary color
        secondary: '#FF5733', // Example secondary color
      },
      backgroundColor: {
        primary: '#141C33', // Use primary color for background
      },
    },
  },
  plugins: [],
};
