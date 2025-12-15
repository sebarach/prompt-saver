import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Esto es crucial para GitHub Pages. 
  // './' hace que las rutas de los assets sean relativas al index.html
  // en lugar de absolutas al dominio.
  base: './', 
})