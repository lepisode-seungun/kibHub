/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/client/src/**/*.{html,ts}',
    './apps/admin/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        suit: ["'SUIT Variable'", 'sans-serif'],
      },
      colors: {
        accent: '#7A48FF',
        'accent-hover': '#8B5CFF',
        'bg-primary': '#0C0B10',
        'bg-secondary': '#1E1D22',
        'bg-tertiary': '#0A090E',
        'bg-card': '#18181B',
        'border-subtle': 'rgba(249,250,251,0.04)',
      },
      letterSpacing: {
        tight: '-0.04em',
      },
    },
  },
  plugins: [],
};
