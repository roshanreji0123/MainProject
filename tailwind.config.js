/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FF7A59',
        secondary: '#3B82F6',
        accent: '#FACC15',
        background: '#FDF2F8',
        text: '#374151',
      },
    },
  },
  plugins: [],
}
