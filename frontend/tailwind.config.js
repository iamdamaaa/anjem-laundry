/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
        },
        palette: {
          light1: '#E3FDFD',
          light2: '#CBF1F5',
          light3: '#A6E3E9',
          light4: '#71C9CE',
          primary: '#2563EB',
        },
        brandText: '#0F172A',
        success: '#22C55E',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '8px',
      },
    },
  },
  plugins: [],
}
