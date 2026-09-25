import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/search.json': {
        target: 'https://serpapi.com',
        changeOrigin: true,
      }
    }
  }
})
