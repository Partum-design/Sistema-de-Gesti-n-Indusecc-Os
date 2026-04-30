import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA plugin removido temporalmente por incompatibilidad con Vite 8
    // Para activar PWA en el futuro, usar una versión compatible de vite-plugin-pwa
  ],
  build: {
    cssMinify: false, // Deshabilitar minificación CSS para evitar problemas con lightningcss
  },
})
