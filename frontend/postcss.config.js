// postcss.config.js
// PostCSS processes our CSS before it reaches the browser.
// We use two plugins:
//   - tailwindcss: generates all the utility classes based on our config
//   - autoprefixer: automatically adds vendor prefixes (like -webkit-)
//     so our CSS works across all browsers without us having to think about it
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
