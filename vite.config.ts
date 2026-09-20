import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { version } from './package.json'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: { target: 'es2022' },
  define: { __APP_VERSION__: JSON.stringify(version) },
})
