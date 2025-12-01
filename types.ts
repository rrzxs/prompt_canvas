
export interface User {
  id: string;
  username: string;
  createdAt: number;
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
  title: string; // Auto-generated or first few words
  type: PromptType;
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
