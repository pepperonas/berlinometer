import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/medical-ai-reports/',
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5063',
        changeOrigin: true
      }
    }
  }
})
