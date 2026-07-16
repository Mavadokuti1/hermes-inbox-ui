import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is set for GitHub Pages project hosting at
// https://<user>.github.io/hermes-inbox-ui/. For local dev it's harmless.
// Override with BASE_PATH env if you fork/rename the repo.
export default defineConfig({
  base: process.env.BASE_PATH || '/hermes-inbox-ui/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
