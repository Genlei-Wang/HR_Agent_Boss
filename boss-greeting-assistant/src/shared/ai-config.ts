/**
 * AI模型配置定义
 */

import type { AIModelType, AIModelConfig } from './ai-service.interface';

/**
 * 各AI模型的默认配置
 */
export const AI_MODEL_CONFIGS: Record<AIModelType, Partial<AIModelConfig>> = {
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
  qwen: {
    type: 'qwen',
    name: 'qwen',
    displayName: '通义千问 (Qwen)',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: 'qwen-vl-plus',
    temperature: 0.2,
    maxTokens: 8192,
    timeout: 30000,
  },
  kimi: {
    type: 'kimi',
    name: 'kimi',
    displayName: 'Kimi Chat',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    temperature: 0.2,
    maxTokens: 8192,
    timeout: 30000,
  },
  deepseek: {
    type: 'deepseek',
    name: 'deepseek',
    displayName: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    temperature: 0.2,
    maxTokens: 8192,
    timeout: 30000,
  },
  wenxin: {
    type: 'wenxin',
    name: 'wenxin',
    displayName: '文心一言',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    model: 'ernie-4.0-8k',
    temperature: 0.2,
    maxTokens: 8192,
    timeout: 30000,
  },
  zhipu: {
    type: 'zhipu',
    name: 'zhipu',
    displayName: '智谱GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-plus',
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

