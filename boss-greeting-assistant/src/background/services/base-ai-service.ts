/**
 * AI服务基类
 * 提供通用功能，各模型服务可以继承或参考
 */

import type { AIService, AIModelConfig } from '../../shared/ai-service.interface';
import type { MatchResult } from '../../shared/types';
import { buildEvaluationPrompt } from '../../shared/prompts';
import { extractJson } from '../../shared/utils-sw';

/**
 * AI服务基类
 * 提供通用的实现逻辑
 */
export abstract class BaseAIService implements AIService {
  protected config: AIModelConfig;
  
  constructor(config: AIModelConfig) {
    this.config = config;
  }
  
  /**
   * 分析候选人（抽象方法，子类必须实现）
   */
  abstract analyzeCandidate(
    imageBase64: string,
    resumeEvaluationPrompt: string,
    candidateInfo?: { index: number; name: string; sessionDir?: string }
  ): Promise<MatchResult>;
  
  /**
   * 测试API Key（抽象方法，子类必须实现）
   */
  abstract testApiKey(): Promise<{ valid: boolean; error?: string; quotaExceeded?: boolean }>;
  
  /**
   * 构建请求提示词（通用方法）
   * @param resumeEvaluationPrompt 简历评估提示词（包含角色和JD要求）
   */
  protected buildPrompt(resumeEvaluationPrompt: string): string {
    return buildEvaluationPrompt(resumeEvaluationPrompt);
  }
  
  /**
   * 解析JSON响应（通用方法）
   */
  protected parseJsonResponse(textContent: string): MatchResult {
    const jsonResult = extractJson(textContent);
    
    if (!jsonResult) {
      throw new Error('无法从AI响应中提取JSON');
    }
    
    if (typeof jsonResult.match !== 'boolean') {
      throw new Error('AI响应缺少match字段或格式错误');
    }
    
    return {
      match: jsonResult.match,
      confidence: jsonResult.confidence || 0.5,
      reason: jsonResult.reason || '未提供原因',
      highlights: Array.isArray(jsonResult.highlights) ? jsonResult.highlights : [],
    };
  }
  
  /**
   * 检查配额错误（通用方法）
   */
  protected isQuotaExceeded(error: any): boolean {
    const errorMsg = error.message || '';
    return errorMsg.includes('429') || 
           errorMsg.includes('quota') || 
           errorMsg.includes('RESOURCE_EXHAUSTED') ||
           errorMsg.includes('配额') ||
           errorMsg.includes('限流');
  }
}

