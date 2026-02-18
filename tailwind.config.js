/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        habi: {
          primary: '#243763',
          gold: '#CFA85B',
          rust: '#A65341',
          cream: '#FAF3E0',
          green: '#2E5E42',
          blue: '#8DBFC5',
          success: '#3E7F63',
          warning: '#D39B22',
          error: '#B9473D',
        }
      }
    },
  },
  plugins: [],
}
