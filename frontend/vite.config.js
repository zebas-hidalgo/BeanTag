import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/beantag/',
  plugins: [react()],
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
})
