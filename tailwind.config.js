/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      screens: {
        'menu': '950px',
      },
      colors: {
        'brand': {
          DEFAULT: '#f2c568',
          '50': '#fef9ed',
          '100': '#fdf2d6',
          '200': '#fbe3ad',
          '300': '#f8cd79',
          '400': '#f2c568',
          '500': '#e8a83a',
          '600': '#d98b1f',
          '700': '#b46a1a',
          '800': '#92551a',
          '900': '#784719',
        },
      },
    },
  },
  plugins: [],
};
