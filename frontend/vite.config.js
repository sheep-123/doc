import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      vue: "vue/dist/vue.esm-bundler.js",
    },
  },
  server: {
    proxy: {
      "/file": {
        target: "http://localhost:8080/file",
        // target: "http://www.test.com/home",
        changeOrigin: true, //跨域
        rewrite: (path) => path.replace(/^\/file/, ""), 
      },
    },
  },
});
