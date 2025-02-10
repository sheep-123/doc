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
      "/home": {
        // target: "http://localhost:8888/home",
        target: "http://www.test.com/home",
        changeOrigin: true, //跨域
        rewrite: (path) => path.replace(/^\/home/, ""), //替换前缀shop,防止多个shop地址
      },
    },
  },
});
