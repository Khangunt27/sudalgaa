/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./screens/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./navigation/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC', // Deep Blue (Mongolian Sky)
          light: '#4D94DB',
          dark: '#004C99',
        },
        secondary: {
          DEFAULT: '#E65100', // Earthy Orange (Gobi)
          light: '#FF833A',
          dark: '#AC3C00',
        },
        accent: {
          DEFAULT: '#2E7D32', // Vibrant Green (Steppe)
          light: '#60AD5E',
          dark: '#005005',
        },
        surface: {
          DEFAULT: '#F5F5F5',
          paper: '#FFFFFF',
          dark: '#121212',
        }
      }
    },
  },
  plugins: [],
}