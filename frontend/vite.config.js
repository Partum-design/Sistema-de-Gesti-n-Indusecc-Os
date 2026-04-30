import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA configurada de forma nativa con manifest + service worker en /public
  ],
  build: {
    cssMinify: false, // Deshabilitar minificacion CSS para evitar problemas con lightningcss
  },
})
