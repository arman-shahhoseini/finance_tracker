/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          50: '#E6F4F3',
          100: '#CCE9E7',
          200: '#99D3CF',
          300: '#66BDB7',
          400: '#33A79F',
          500: '#0F766E',
          600: '#0C5E58',
          700: '#094742',
          800: '#062F2C',
          900: '#031816'
        },
        accent: {
          DEFAULT: '#EA580C',
          light: '#FB923C'
        },
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917'
        }
      },
      fontFamily: {
        'vazir': ['Vazirmatn', 'sans-serif'],
        'manrope': ['Manrope', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.04)',
        'card': '0 4px 12px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
}
