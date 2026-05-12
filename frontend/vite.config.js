import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js
// Vite is the build tool and dev server for this project.
// It replaces the older Create React App setup and is much faster.
// - "plugins: [react()]" enables JSX transformation and React Fast Refresh
//   (which means your browser updates instantly when you save a file)
// - "resolve.alias" lets us write "import X from '@/components/X'" instead
//   of messy relative paths like "../../components/X"
// - "server.proxy" forwards any API call starting with /api to our Java
//   backend running on port 8080 during local development

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
