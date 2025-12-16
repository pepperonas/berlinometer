import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/popular-times/',
  build: {
    outDir: 'build-mrx3k1',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    host: true
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://mrx3k1.de/api/popular-times')
  }
})