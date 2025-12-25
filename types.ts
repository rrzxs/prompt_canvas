
export interface User {
  id: string;
  username: string;
  createdAt: number;
}

export interface AuthorInfo {
  id: string;
  username: string;
}

export enum PromptType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  VIDEO_PLAN = 'VIDEO_PLAN',
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface PromptVersion {
  id: string;
  text: string;
  timestamp: number;
  imageUrl?: string; // For image prompts
  videoSettings?: VideoSettings; // For video prompts
  x?: number; // Canvas X position
  y?: number; // Canvas Y position
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface PromptItem {
  id: string;
  userId: string;
  author?: AuthorInfo; // 作者信息（公开提示词时包含）
  title: string; // Auto-generated or first few words
  type: PromptType;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  
  // State for Image Prompts
  versions: PromptVersion[];
  activeVersionId: string;
  draftText?: string; // Initial text before first generation

  // State for Text/Reasoning Prompts
  chatHistory: ChatMessage[];
  
  // General attachments (references)
  attachments?: Attachment[];
}

export interface VideoSettings {
  cameraMovement?: string; // e.g., "Pan Left", "Zoom In"
  lighting?: string; // e.g., "Cinematic", "Neon"
  style?: string; // e.g., "Sora Realistic", "Grok Anime"
  action?: string; // e.g. "Walking", "Running"
  expression?: string; // e.g. "Happy", "Serious"
  duration?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
}

export interface DiffResult {
  type: 'same' | 'added' | 'removed';
  value: string;
}

// 积分相关类型定义
export interface CreditBalance {
  current_balance: number;
  daily_limit: number;
  last_recovery_time: string;
  last_reset_date: string;
  next_recovery_time: string;
  next_reset_time: string;
}

export interface CreditLog {
  id: number;
  operation_type: 'consume' | 'recover' | 'reset';
  amount: number;
  balance_before: number;
  balance_after: number;
  service_type?: string;
  description?: string;
  created_at: string;
}

export interface CreditHistory {
  logs: CreditLog[];
  total_records: number;
  query_days: number;
  operation_type_filter?: string;
  today_statistics: {
    total_consumed_today: number;
    total_recovered_today: number;
    total_reset_today: number;
  };
}

export interface ServiceCosts {
  image_generation: {
    cost: number;
    description: string;
    service_type: string;
  };
  text_chat: {
    cost: number;
    description: string;
    service_type: string;
  };
  daily_limit: number;
  hourly_recovery: number;
  system_enabled: boolean;
}

export interface CreditCheckResult {
  sufficient: boolean;
  required_credits: number;
  current_balance: number;
  service_type: string;
  shortage?: number;
  remaining_after_use?: number;
  next_recovery_time?: string;
  next_reset_time?: string;
  message: string;
}
