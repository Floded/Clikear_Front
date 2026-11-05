/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      radius: {
        sm: calc(var(--radius) * 0.6),
        md: calc(var(--radius) * 0.8),
        lg: var(--radius),
        xl: calc(var(--radius) * 1.4),
        '2xl': calc(var(--radius) * 1.8),
        '3xl': calc(var(--radius) * 2.2),
        '4xl': calc(var(--radius) * 2.6),
      },
    },
  },
}