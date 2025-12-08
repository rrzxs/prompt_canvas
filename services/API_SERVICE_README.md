# API 服务使用指南

## 概述

`apiService.ts` 提供了一个统一的 API 服务层，用于与后端 FastAPI 服务进行通信。

## 配置

在项目根目录创建 `.env.local` 文件，配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:8000
```

如果不配置，默认使用 `http://localhost:8000`。

## 使用方法

### 导入服务

```typescript
import { apiService } from './services/apiService';
```

### 认证相关

```typescript
// 注册
const user = await apiService.register('username', 'password');

// 登录
const authResponse = await apiService.login('username', 'password');
// JWT 令牌会自动保存到 localStorage

// 获取当前用户
const currentUser = await apiService.getCurrentUser();

// 登出
apiService.logout();
```

### 提示词管理

```typescript
// 获取提示词列表
const prompts = await apiService.getPrompts();
const imagePrompts = await apiService.getPrompts('IMAGE');

// 获取单个提示词
const prompt = await apiService.getPrompt(promptId);

// 创建提示词
const newPrompt = await apiService.createPrompt({
  title: '我的提示词',
  type: PromptType.IMAGE,
  tags: ['标签1', '标签2'],
  draftText: '初始文本'
});

// 更新提示词
const updatedPrompt = await apiService.updatePrompt(promptId, {
  title: '新标题'
});

// 删除提示词
await apiService.deletePrompt(promptId);
```

### 版本管理

```typescript
// 添加版本
const version = await apiService.addVersion(promptId, {
  text: '提示词文本',
  imageUrl: 'https://example.com/image.png',
  x: 100,
  y: 200
});

// 删除版本
await apiService.deleteVersion(promptId, versionId);

// 更新版本位置
const updatedVersion = await apiService.updateVersionPosition(
  promptId,
  versionId,
  150,
  250
);
```

### AI 服务

```typescript
// 分类提示词
const classification = await apiService.classifyPrompt('一只可爱的猫');
// 返回: { type: 'IMAGE', title: '可爱的猫', tags: ['动物', '猫', '可爱'] }

// 生成图片
const imageUrl = await apiService.generateImage('一只可爱的猫');
const imageWithRef = await apiService.generateImage(
  '一只可爱的猫',
  'data:image/png;base64,...'
);

// 发送聊天消息
const response = await apiService.sendChatMessage(
  chatHistory,
  '你好，请帮我写一个提示词',
  attachments
);

// 转换为视频提示词
const videoPrompt = await apiService.convertToVideoPrompt(
  '一只可爱的猫',
  { cameraMovement: 'Pan Left', lighting: 'Cinematic' }
);
```

### 数据管理

```typescript
// 导出数据
const blob = await apiService.exportData();
// 创建下载链接
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'prompts-export.json';
a.click();

// 导入数据
const file = event.target.files[0];
const result = await apiService.importData(file);
console.log(`导入了 ${result.imported_count} 条记录`);
```

### 文件管理

```typescript
// 上传图片
const file = event.target.files[0];
const uploadResult = await apiService.uploadImage(file);
console.log(uploadResult.url); // 图片访问 URL

// 获取图片 URL
const imageUrl = apiService.getImageUrl('filename.png');
```

## 错误处理

API 服务会自动处理 401 错误（未授权），清除令牌并重定向到登录页。

其他错误需要在调用时使用 try-catch 捕获：

```typescript
try {
  const prompts = await apiService.getPrompts();
} catch (error) {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;
    console.error('API 错误:', apiError?.message);
  }
}
```

## 自动令牌管理

- 登录成功后，JWT 令牌会自动保存到 `localStorage`
- 所有需要认证的请求会自动在请求头中添加 `Authorization: Bearer <token>`
- 令牌过期或无效时，会自动清除并重定向到登录页
- 登出时会自动清除令牌

## 类型安全

所有 API 方法都有完整的 TypeScript 类型定义，确保类型安全。
