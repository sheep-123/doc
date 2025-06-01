import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import path from 'path';

import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      verbose: true, //是否在控制台输出压缩结果
      disable: false, //是否禁用
      algorithm: 'brotliCompress', //br压缩
      ext: '.br', //压缩文件扩展名
      threshold: 10240, //超过10k进行压缩
      deleteOriginFile: false //是否删除源文件
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      // 为后端接口添加统一前缀
      '/api': {
        target: 'http://localhost:7777',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    host: true,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vueVendor: ['vue', 'vue-router'],
          elementPlus: ['element-plus'],
          utils: ['lodash-es', 'axios'],
        }
      }
    }
  }
});
