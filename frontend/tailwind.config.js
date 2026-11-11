/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Палитра: хвойные оттенки, шалфейный акцент. Значения — в index.css.
        deep: token('deep'),
        forest: token('forest'),
        moss: token('moss'),
        pine: token('pine'),
        sage: token('sage'),
        mint: token('mint'),
        accent: token('sage'),
        accent2: token('accent2'),
        expense2: token('expense2'),
        income: token('income'),
        expense: token('expense'),
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
