import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'build-berlinometer',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    host: true
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://berlinometer.de')
  }
})