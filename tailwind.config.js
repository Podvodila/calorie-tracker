/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAFAF7',
        'bg-card': '#F0EDE6',
        'bg-elevated': '#FFFFFF',
        'calories': '#E8613A',
        'protein': '#42A5F5',
        'carbs': '#F87171',
        'fat': '#F5B731',
        'accent': '#4A3AE8',
        'accent-light': '#6B5CF7',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'text-muted': '#9B9B9B',
        'border': '#E5E2DB',
        'border-light': '#F0EDE6',
        'success': '#2A9D6E',
        'warning': '#E5A832',
        'danger': '#D94F70',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
