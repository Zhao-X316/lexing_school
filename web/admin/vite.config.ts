import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'element-plus'
          }
          if (id.includes('echarts')) {
            return 'echarts'
          }
          if (id.includes('wangeditor')) {
            return 'wangeditor'
          }
          if (id.includes('axios')) {
            return 'axios'
          }
          if (id.includes('vue-router') || id.includes('pinia')) {
            return 'vue-vendor'
          }
          if (/node_modules[/\\]vue[/\\]/.test(id)) {
            return 'vue-vendor'
          }
        }
      }
    },
    // element-plus / wangeditor 等 vendor 分包后单文件仍可达 ~1MB，属正常体积
    chunkSizeWarningLimit: 1100
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/upload': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
