import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Otobuscum/',
  plugins: [react()],
  server: {
    proxy: {
      '/ekomobil-api': {
        target: 'https://e-komobil.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ekomobil-api/, ''),
        headers: {
          Origin: 'https://e-komobil.com',
          Referer: 'https://e-komobil.com/yolcu_bilgilendirme.php',
        },
      },
    },
  },
})
