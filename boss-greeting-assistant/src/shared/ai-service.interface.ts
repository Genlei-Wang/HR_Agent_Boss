/**
 * AI服务接口定义
 * 用于支持多种AI模型（Gemini、通义千问、Kimi等）
 */

import type { MatchResult } from './types';

/**
 * AI服务接口
 * 所有AI模型服务都应实现此接口
 */
export interface AIService {
  /**
   * 分析候选人是否匹配JD要求
   * @param imageBase64 候选人工作经历截图（Base64格式）
   * @param jobDescription 职位描述
   * @param candidateInfo 候选人信息（可选）
   * @returns 匹配结果
   */
  analyzeCandidate(
    imageBase64: string,
    jobDescription: string,
    candidateInfo?: { index: number; name: string; sessionDir?: string }
  ): Promise<MatchResult>;

  /**
   * 测试API Key是否有效
   * @returns 测试结果
   */
  testApiKey(): Promise<{ valid: boolean; error?: string; quotaExceeded?: boolean }>;
}

/**
 * AI模型类型
 */
export type AIModelType = 'gemini' | 'qwen' | 'kimi' | 'deepseek' | 'wenxin' | 'zhipu';

/**
 * AI模型配置
 */
export interface AIModelConfig {
  type: AIModelType;
  name: string;
  displayName: string;
  apiKey: string;
  endpoint?: string; // 某些模型可能需要自定义endpoint
  model?: string; // 模型名称（如 gemini-2.5-flash, qwen-vl-plus等）
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * AI服务工厂
 * 根据模型类型创建对应的服务实例
 */
export class AIServiceFactory {
  /**
   * 创建AI服务实例
   */
  static async createService(config: AIModelConfig): Promise<AIService> {
    switch (config.type) {
      case 'gemini':
        const { GeminiService } = await import('../background/services/gemini-service');
        return new GeminiService(config);
      
      case 'qwen':
        const { QwenService } = await import('../background/services/qwen-service');
        return new QwenService(config);
      
      case 'kimi':
        const { KimiService } = await import('../background/services/kimi-service');
        return new KimiService(config);
      
      case 'deepseek':
        const { DeepSeekService } = await import('../background/services/deepseek-service');
        return new DeepSeekService(config);
      
      case 'wenxin':
        const { WenxinService } = await import('../background/services/wenxin-service');
        return new WenxinService(config);
      
      case 'zhipu':
        const { ZhipuService } = await import('../background/services/zhipu-service');
        return new ZhipuService(config);
      
      default:
        throw new Error(`不支持的AI模型类型: ${config.type}`);
    }
  }

  /**
   * 获取支持的模型列表
   */
  static getSupportedModels(): Array<{ type: AIModelType; name: string; displayName: string }> {
    return [
      { type: 'gemini', name: 'gemini', displayName: 'Google Gemini' },
      { type: 'qwen', name: 'qwen', displayName: '通义千问 (Qwen)' },
      { type: 'kimi', name: 'kimi', displayName: 'Kimi Chat' },
      { type: 'deepseek', name: 'deepseek', displayName: 'DeepSeek' },
      { type: 'wenxin', name: 'wenxin', displayName: '文心一言' },
      { type: 'zhipu', name: 'zhipu', displayName: '智谱GLM' },
    ];
  }
}

