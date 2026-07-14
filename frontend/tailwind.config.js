/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ethara: {
          dark: '#0B0F19',
          card: '#151D30',
          border: '#1F293D',
          primary: '#4F46E5', // indigo-600
          accent: '#06B6D4',  // cyan-500
          success: '#10B981', // emerald-500
          warning: '#F59E0B', // amber-500
          danger: '#EF4444'   // red-500
        }
      }
    },
  },
  plugins: [],
}
