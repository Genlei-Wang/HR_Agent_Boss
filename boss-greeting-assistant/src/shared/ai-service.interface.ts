/**
 * AI服务接口定义
 * 用于支持多种AI模型（Gemini、通义千问）
 */

import type { MatchResult } from './types';
// 直接导入服务，避免动态导入导致的DOM API问题
import { GeminiService } from '../background/services/gemini-service';
import { QwenService } from '../background/services/qwen-service';

/**
 * AI服务接口
 * 所有AI模型服务都应实现此接口
 */
export interface AIService {
  /**
   * 分析候选人是否匹配JD要求
   * @param imageBase64 候选人工作经历截图（Base64格式）
   * @param resumeEvaluationPrompt 简历评估提示词（包含角色和JD要求）
   * @param candidateInfo 候选人信息（可选）
   * @returns 匹配结果
   */
  analyzeCandidate(
    imageBase64: string,
    resumeEvaluationPrompt: string,
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
export type AIModelType = 'gemini' | 'qwen';

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
   * 使用直接导入避免动态导入导致的DOM API问题
   */
  static createService(config: AIModelConfig): AIService {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-service.interface.ts:61',message:'createService开始',data:{modelType:config.type,hasDocument:typeof document !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'api-test',hypothesisId:'E'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    switch (config.type) {
      case 'gemini':
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-service.interface.ts:64',message:'创建Gemini服务',data:{hasDocument:typeof document !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'api-test',hypothesisId:'F'})}).catch(()=>{});
        } catch (e) {}
        // #endregion
        return new GeminiService(config);
      
      case 'qwen':
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-service.interface.ts:68',message:'创建Qwen服务',data:{hasDocument:typeof document !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'api-test',hypothesisId:'G'})}).catch(()=>{});
        } catch (e) {}
        // #endregion
        return new QwenService(config);
      
      default:
        throw new Error(`不支持的AI模型类型: ${config.type}`);
    }
  }

  /**
   * 获取支持的模型列表
   */
  static getSupportedModels(): Array<{ type: AIModelType; name: string; displayName: string }> {
    return [
      { type: 'qwen', name: 'qwen', displayName: '通义千问 (Qwen)' },
      { type: 'gemini', name: 'gemini', displayName: 'Google Gemini' },
    ];
  }
}

