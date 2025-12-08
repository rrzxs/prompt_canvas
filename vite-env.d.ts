/// <reference types="vite/client" />

// 环境变量类型定义
// 注意：前端不再需要 API_KEY，所有 AI 服务调用已迁移到后端
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
