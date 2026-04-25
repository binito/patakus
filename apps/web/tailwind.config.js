/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e8b96a',
          50:  '#fdf8ed',
          100: '#f9edcc',
          200: '#f2d88a',
          300: '#ecc250',
          400: '#e8b96a',
          500: '#d4943a',
          600: '#b8732a',
          700: '#96551e',
          800: '#744018',
          900: '#5a3012',
        },
      },
    },
  },
  plugins: [],
};
