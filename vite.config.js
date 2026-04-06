import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: '.',
  base: mode === 'production' ? '/Fixetta.ai/' : '/',
  server: {
    port: 3000,
    open: true
  }
}))
