import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build:{
    outDir: "../static"
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: ['max.local', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // 后端接口地址
        changeOrigin: true, // 允许跨域
      },
      '/static': {
        target: 'http://localhost:3001', // 后端接口地址
        changeOrigin: true, // 允许跨域
      }
    }
  }
});