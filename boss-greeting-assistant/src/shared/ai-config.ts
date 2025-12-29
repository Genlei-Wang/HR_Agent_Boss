/**
 * AI模型配置定义
 */

import type { AIModelType, AIModelConfig } from './ai-service.interface';

/**
 * 各AI模型的默认配置
 */
export const AI_MODEL_CONFIGS: Record<AIModelType, Partial<AIModelConfig>> = {
  qwen: {
    type: 'qwen',
    name: 'qwen',
    displayName: '通义千问 (Qwen)',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: 'qwen3-vl-plus',
    temperature: 0.2,
    maxTokens: 8192,
    timeout: 30000,
  },
  gemini: {
    type: 'gemini',
    name: 'gemini',
    displayName: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    maxTokens: 8192,
    timeout: 30000,
  },
};

/**
 * 获取模型的完整配置
 */
export function getModelConfig(type: AIModelType, apiKey: string): AIModelConfig {
  const baseConfig = AI_MODEL_CONFIGS[type];
  if (!baseConfig) {
    throw new Error(`不支持的AI模型类型: ${type}`);
  }
  
  return {
    ...baseConfig,
    apiKey,
  } as AIModelConfig;
}

