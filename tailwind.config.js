/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        moon: {
          bg:        '#F5F0E8',
          primary:   '#2C4A6E',
          secondary: '#5C7A9E',
          card:      '#EDE8DF',
          muted:     '#8BA5C0',
        },
      },
    },
  },
  plugins: [],
}
