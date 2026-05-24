import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@vercel/analytics'],
        },
        // Merge chunks smaller than 10 KB into their importers to reduce
        // network waterfall depth (Lighthouse "Avoid chaining critical requests").
        experimentalMinChunkSize: 10000,
      },
    },
  },
})
