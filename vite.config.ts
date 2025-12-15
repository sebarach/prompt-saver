import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 1. Esto asegura que las rutas de scripts y estilos sean relativas
  base: './', 
  build: {
    // 2. Cambiamos la salida de 'dist' a 'docs'.
    // GitHub Pages tiene una opción nativa para servir desde la carpeta /docs
    // lo que hace el despliegue mucho más fácil.
    outDir: 'docs',
  }
})