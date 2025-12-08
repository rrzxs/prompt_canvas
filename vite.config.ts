import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 前端配置已简化：不再需要加载 API_KEY
// 所有 AI 服务调用已迁移到后端，API 密钥安全地存储在后端服务器
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
