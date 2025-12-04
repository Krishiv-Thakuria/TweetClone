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
        'chat-bg': '#343541',
        'chat-sidebar': '#202123',
        'chat-input': '#40414f',
        'chat-border': '#565869',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

