/** @type {import('tailwindcss').Config} */

// tailwind.config.js
// Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS
// files, you apply small single-purpose classes directly in your JSX, e.g.:
//   <div className="flex items-center gap-4 bg-surface rounded-xl p-6">
//
// This config file does two things:
// 1. Tells Tailwind which files to scan so it only includes CSS classes you
//    actually use (keeping the final bundle small).
// 2. Extends Tailwind's default color palette with our custom design tokens
//    so we can write className="bg-brand" or "text-gold" etc.

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand palette — deep navy + gold (World Cup feel)
        brand: {
          DEFAULT: '#0A1628',
          light: '#132140',
          muted: '#1E3460',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C96A',
          dark: '#9E7A2E',
        },
        // Functional surface colors
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F4F6FA',
          dark: '#0D1B2A',
          'dark-secondary': '#152035',
        },
        // Accent for live / active states
        pitch: '#2D6A4F',    // grass green for formation pitch
        live: '#E53935',     // red for live match indicators
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],   // bold headings
        body: ['"DM Sans"', 'sans-serif'],          // body text
        mono: ['"JetBrains Mono"', 'monospace'],   // scores / numbers
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(10,22,40,0.08)',
        'card-hover': '0 8px 32px 0 rgba(10,22,40,0.14)',
        gold: '0 0 20px rgba(201,168,76,0.3)',
      },
    },
  },
  plugins: [],
}
