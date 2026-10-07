import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project site needs /helpmeread-web/; local dev stays at /
  base: process.env.GHPAGES ? '/helpmeread-web/' : '/',
  plugins: [react()],
})
