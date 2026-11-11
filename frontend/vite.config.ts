import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // В dev проксируем /api на локальный FastAPI
      '/api': {
        target: 'http://127.0.0.1:8123',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
