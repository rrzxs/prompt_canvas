/**
 * geminiService.ts
 * 
 * 此文件已废弃 - 所有 AI 服务调用已迁移到后端 API
 * 保留类型定义以供参考
 * 
 * 原有的直接 Gemini API 调用已被注释，系统现在使用：
 * - 后端代理所有 AI 服务请求
 * - apiService.ts 进行所有 AI 功能调用
 * - API 密钥安全地存储在后端服务器
 */

import { PromptType, Attachment } from "../types";

// ============================================================================
// 已废弃的直接 API 调用实现（已注释）
// ============================================================================

/*
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Sanitize API Key: remove whitespace and quotes that might be injected by build tools/env files
const rawApiKey = process.env.API_KEY || '';
const API_KEY = rawApiKey.replace(/["']/g, '').trim();

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to ensure we don't call API without key
const checkApiKey = () => {
  if (!API_KEY) throw new Error("API Key is missing. Please check your environment variables.");
};

// Diagnostic helper to check API Key status safely in UI
export const getApiKeyInfo = () => {
  if (!API_KEY) return { status: 'missing', length: 0, preview: 'N/A' };
  
  const isValidFormat = API_KEY.startsWith('AIza');
  const hasWhitespace = /\s/.test(API_KEY);
  
  return {
    status: isValidFormat && !hasWhitespace ? 'valid_format' : 'invalid_format',
    length: API_KEY.length,
    preview: `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`,
    hasWhitespace
  };
};

// Auto-categorize the user's input to decide if it's a visual prompt or a text/reasoning task.
// Wrapped in try/catch to prevent blocking UI if API fails.
export const classifyPrompt = async (input: string): Promise<{ type: PromptType, title: string, tags: string[] }> => {
  try {
    checkApiKey();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following user prompt: "${input}". 
      
      Your task is to classify this prompt into one of two types: IMAGE or TEXT.
  
      CRITICAL RULES:
      1. Set type to "TEXT" if:
         - The prompt is a system instruction, role definition (e.g., "You are an expert...", "Act as a director...", "你是一位...").
         - The prompt asks to *write* or *refine* a prompt (e.g., "Write a prompt for Sora", "Create a JSON template").
         - The prompt is conversational, a question, or a request for code/reasoning.
      
      2. Set type to "IMAGE" ONLY if:
         - The prompt is a direct visual description of a scene intended to be rendered immediately as a picture (e.g., "A stunning photo of...", "Cyberpunk city street", "一只猫...").
      
      Also provide a short title (max 5 words) and 3 relevant tags. If the input is Chinese, please provide the title and tags in Chinese.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["IMAGE", "TEXT"] },
            title: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
  
    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");
    
    const result = JSON.parse(jsonText);
    return {
      type: result.type === "IMAGE" ? PromptType.IMAGE : PromptType.TEXT,
      title: result.title || input.slice(0, 10),
      tags: result.tags || []
    };
  } catch (e) {
    console.warn("Prompt classification failed, using default.", e);
    // Fallback defaults so the user isn't blocked from creating a prompt
    return { 
      type: PromptType.TEXT, 
      title: input.slice(0, 15) + (input.length > 15 ? "..." : ""), 
      tags: ["新提示词"] 
    };
  }
};

// Generate an image based on the prompt.
// Model: Gemini 3 Pro Image Preview (gemini-3-pro-image-preview)
// Supports optional reference image for image-to-image generation.
export const generateImage = async (prompt: string, referenceImageBase64?: string): Promise<string> => {
  checkApiKey();

  try {
    const parts: any[] = [{ text: prompt }];
    
    if (referenceImageBase64) {
        // Extract base64 data and mime type (e.g., "data:image/png;base64,.....")
        const matches = referenceImageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            parts.push({
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                }
            });
        }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
      },
    });

    const outputParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of outputParts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from Gemini 3 Pro Image");
  } catch (error) {
    console.error("Gemini 3 Pro Image generation failed", error);
    throw error;
  }
};

// Convert a standard image prompt into a detailed video generation prompt.
export const convertToVideoPrompt = async (
  originalPrompt: string, 
  settings: any
): Promise<string> => {
  checkApiKey();
  
  const context = JSON.stringify(settings);
  const prompt = `Rewrite the following image prompt into a highly detailed video generation prompt suitable for a model like Sora or Grok.
  Original Prompt: "${originalPrompt}"
  
  Apply these video settings: ${context}
  
  Include specific keywords for camera movement, lighting, and motion. Output ONLY the raw prompt text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || originalPrompt;
};

// Chat with the model for reasoning tasks.
// Supports optional attachments (images, docs, etc.) for multimodal chat.
export const sendChatMessage = async (history: any[], newMessage: string, attachments?: Attachment[]) => {
  checkApiKey();
  
  // Construct chat history for SDK
  // Map internal ChatMessage to SDK Content format
  const sdkHistory = history.map(h => {
    const parts: any[] = [{ text: h.text }];
    
    // Add attachments to history if present
    if (h.attachments && h.attachments.length > 0) {
        h.attachments.forEach((att: Attachment) => {
            const matches = att.data.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                parts.push({
                    inlineData: {
                        mimeType: matches[1],
                        data: matches[2]
                    }
                });
            }
        });
    }
    
    return {
      role: h.role,
      parts: parts
    };
  });

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: sdkHistory
  });

  // Construct current message parts
  const messageParts: any[] = [{ text: newMessage }];
  if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
          const matches = att.data.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
              messageParts.push({
                  inlineData: {
                      mimeType: matches[1],
                      data: matches[2]
                  }
              });
          }
      });
  }

  const result = await chat.sendMessage({ message: messageParts });
  return result.text;
};
*/

// ============================================================================
// 保留的类型定义（供参考）
// ============================================================================

// 分类结果类型
export interface ClassificationResult {
  type: PromptType;
  title: string;
  tags: string[];
}

// ============================================================================
// 注意事项
// ============================================================================
// 
// 所有 AI 服务调用现在应该通过 apiService.ts 进行：
// - 提示词分类: apiService.classifyPrompt(input)
// - 图片生成: apiService.generateImage(prompt, referenceImage)
// - 聊天对话: apiService.sendChatMessage(history, message, attachments)
// - 视频提示词转换: apiService.convertToVideoPrompt(prompt, settings)
//
// API 密钥现在安全地存储在后端服务器的环境变量中
// 前端不再需要配置或访问 API_KEY
// ============================================================================