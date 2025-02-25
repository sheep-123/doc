import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path'

import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
    viteCompression({
      verbose: true,//是否在控制台输出压缩结果
      disable: false,//是否禁用
      algorithm: 'brotliCompress',//br压缩
      ext: '.br',//压缩文件扩展名
      threshold:10240,//超过10k进行压缩
      deleteOriginFile:false,//是否删除源文件
      
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/file": {
        target: "http://localhost:7777/file",
        // target: "http://www.test.com/home",
        changeOrigin: true, //跨域
        rewrite: (path) => path.replace(/^\/file/, ""), 
      },
    },
    host:true,
    open: true,
  },
   optimizeDeps: {
    include: [
      'pdfjs-dist/es5/build/pdf.js',
      'pdfjs-dist/es5/build/pdf.worker.js'
    ],
  },
    build: {
    commonjsOptions: {
      transformMixedEsModules: true,
            include: [/node_modules/]
    }
  }

});
