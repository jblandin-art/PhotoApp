import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/user': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/photosOfUser': 'http://localhost:3000',
      '/photosWithMentions': 'http://localhost:3000',
      '/commentsOfPhoto': 'http://localhost:3000',
      '/photos': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/me': 'http://localhost:3000',
      '/test': 'http://localhost:3000',
    }
  }
})
