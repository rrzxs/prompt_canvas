# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**观想阁 (Prompt Canvas)** - 智能提示词管理工作区，支持图像生成、文本/推理对话和视频提示词转换。

## 常用命令

```bash
# 开发
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (localhost:5173)
npm run build        # 生产构建 (输出到 dist/)
npm run preview      # 预览构建结果
```

## 技术栈

- **前端**: React 19 + TypeScript + Vite 6
- **路由**: React Router 7 (HashRouter)
- **样式**: Tailwind CSS (CDN)
- **HTTP**: Axios + JWT 拦截器
- **Markdown**: react-markdown + rehype-highlight + remark-gfm

## 架构设计

### 核心数据类型 (types.ts)

```
PromptItem          # 提示词主实体
├── PromptType      # IMAGE | TEXT | VIDEO_PLAN
├── PromptVersion   # 版本记录（含画布坐标）
├── ChatMessage     # 对话历史
└── VideoSettings   # 视频参数
```

积分系统：`CreditBalance` / `CreditLog` / `CreditHistory` / `CreditCheckResult`

### 路由结构

```
/                   → LandingPage (登录/注册)
/dashboard          → 仪表盘
/prompt/:id         → ImageCanvas 或 ChatInterface（根据类型）
/library            → 提示词库
```

### 组件分工

| 组件 | 职责 |
|------|------|
| `ImageCanvas.tsx` | 图像提示词画布，版本拖拽、缩放、Diff 显示 |
| `ChatInterface.tsx` | 文本对话，Markdown 渲染、附件上传 |
| `PromptShareModal.tsx` | 分享卡片生成，html2canvas + 二维码 |
| `VideoModal.tsx` | 视频提示词参数配置与转换 |
| `Credit*.tsx` | 积分系统组件族 |

### API 服务层 (services/apiService.ts)

统一封装后端通信，自动处理 JWT 令牌：

```typescript
import { apiService } from './services/apiService';

// 认证
await apiService.login(username, password);
await apiService.logout();

// 提示词 CRUD
await apiService.getPrompts(type?);
await apiService.createPrompt({ title, type, tags, draftText });
await apiService.updatePrompt(id, updates);

// AI 服务（后端代理）
await apiService.generateImage(prompt, referenceImage?);
await apiService.sendChatMessage(history, message, attachments);
await apiService.classifyPrompt(text);
```

## 环境配置

```bash
# .env.local (开发)
VITE_API_BASE_URL=http://localhost:8000

# .env.production (生产)
VITE_API_BASE_URL=
```

## 关键设计决策

1. **HashRouter** - 支持 AI Studio 和静态文件部署
2. **后端代理 AI** - 所有 Gemini API 调用通过后端，不在前端暴露密钥
3. **Tailwind CDN** - 在 index.html 中配置主题色（canvas/panel/accent）
4. **JWT 自动管理** - 登录后存储 localStorage，401 自动登出

## 弃用模块

- `geminiService.ts` - AI 调用已迁至后端
- `storageService.ts` - IndexedDB 已迁至后端 MySQL
