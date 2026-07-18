import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/beantag/',
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
})
