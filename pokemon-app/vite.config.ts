import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cloudflare Pages 배포를 위한 최적화 설정
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // MIME 타입 오류 방지를 위한 설정
    sourcemap: false,
  },
})
