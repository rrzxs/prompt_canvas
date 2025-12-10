import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  User, 
  PromptItem, 
  PromptVersion, 
  ChatMessage, 
  Attachment,
  VideoSettings 
} from '../types';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 认证响应接口
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

// 分类结果接口
export interface ClassificationResult {
  type: string;
  title: string;
  tags: string[];
}

// 上传结果接口
export interface UploadResult {
  url: string;
  filename: string;
}

// 导入结果接口
export interface ImportResult {
  imported_count: number;
}

// API 错误接口
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * API 服务类
 * 统一管理所有后端 API 调用
 */
class ApiService {
  private client: AxiosInstance;
  private tokenKey = 'promptcanvas_token';

  constructor() {
    // 创建 axios 实例
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器：自动添加 JWT 令牌
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：处理 401 错误
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // 清除令牌并重定向到登录页
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== 令牌管理 ====================

  /**
   * 获取存储的 JWT 令牌
   */
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * 保存 JWT 令牌
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * 清除 JWT 令牌
   */
  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // ==================== 认证 API ====================

  /**
   * 用户注册
   */
  async register(username: string, password: string): Promise<User> {
    const response = await this.client.post<User>('/api/auth/register', {
      username,
      password,
    });
    return response.data;
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', {
      username,
      password,
    });
    
    // 保存令牌
    this.setToken(response.data.accessToken);
    
    return response.data;
  }

  /**
   * 用户登出
   */
  logout(): void {
    this.clearToken();
    // 清除会话用户信息
    localStorage.removeItem('promptcanvas_session');
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/auth/me');
    return response.data;
  }

  // ==================== 提示词 API ====================

  /**
   * 获取提示词列表
   */
  async getPrompts(category?: string): Promise<PromptItem[]> {
    const params = category ? { category } : {};
    const response = await this.client.get<PromptItem[]>('/api/prompts', { params });
    return response.data;
  }

  /**
   * 获取单个提示词详情
   */
  async getPrompt(id: string): Promise<PromptItem> {
    const response = await this.client.get<PromptItem>(`/api/prompts/${id}`);
    return response.data;
  }

  /**
   * 创建提示词
   */
  async createPrompt(prompt: Partial<PromptItem>): Promise<PromptItem> {
    const response = await this.client.post<PromptItem>('/api/prompts', prompt);
    return response.data;
  }

  /**
   * 更新提示词
   */
  async updatePrompt(id: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
    const response = await this.client.put<PromptItem>(`/api/prompts/${id}`, prompt);
    return response.data;
  }

  /**
   * 删除提示词
   */
  async deletePrompt(id: string): Promise<void> {
    await this.client.delete(`/api/prompts/${id}`);
  }

  // ==================== 版本 API ====================

  /**
   * 添加版本
   */
  async addVersion(promptId: string, version: Partial<PromptVersion>): Promise<PromptVersion> {
    const response = await this.client.post<PromptVersion>(
      `/api/prompts/${promptId}/versions`,
      version
    );
    return response.data;
  }

  /**
   * 删除版本
   */
  async deleteVersion(promptId: string, versionId: string): Promise<void> {
    await this.client.delete(`/api/prompts/${promptId}/versions/${versionId}`);
  }

  /**
   * 更新版本位置
   */
  async updateVersionPosition(
    promptId: string,
    versionId: string,
    x: number,
    y: number
  ): Promise<PromptVersion> {
    const response = await this.client.patch<PromptVersion>(
      `/api/prompts/${promptId}/versions/${versionId}/position`,
      { x, y }
    );
    return response.data;
  }

  // ==================== AI 服务 API ====================

  /**
   * 分类提示词
   */
  async classifyPrompt(text: string): Promise<ClassificationResult> {
    const response = await this.client.post<ClassificationResult>('/api/ai/classify', {
      text,
    });
    return response.data;
  }

  /**
   * 生成图片
   */
  async generateImage(prompt: string, referenceImage?: string): Promise<string> {
    const response = await this.client.post<{ image_url: string }>(
      '/api/ai/generate-image',
      {
        prompt,
        reference_image: referenceImage,
      },
      {
        timeout: 120000, // 图片生成需要更长时间，设置为 120 秒
      }
    );
    return response.data.image_url;
  }

  /**
   * 发送聊天消息
   */
  async sendChatMessage(
    history: ChatMessage[],
    message: string,
    attachments?: Attachment[]
  ): Promise<string> {
    const response = await this.client.post<{ response: string }>('/api/ai/chat', {
      history,
      message,
      attachments,
    });
    return response.data.response;
  }

  /**
   * 转换为视频提示词
   */
  async convertToVideoPrompt(prompt: string, settings: VideoSettings): Promise<string> {
    const response = await this.client.post<{ video_prompt: string }>('/api/ai/convert-video', {
      prompt,
      settings,
    });
    return response.data.video_prompt;
  }

  // ==================== 数据管理 API ====================

  /**
   * 导出数据
   */
  async exportData(): Promise<Blob> {
    const response = await this.client.get('/api/data/export', {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * 导入数据
   */
  async importData(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.client.post<ImportResult>('/api/data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // ==================== 文件 API ====================

  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.client.post<UploadResult>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 获取图片 URL
   */
  getImageUrl(filename: string): string {
    return `${API_BASE_URL}/api/files/${filename}`;
  }
}

// 导出单例实例
export const apiService = new ApiService();
