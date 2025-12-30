/**
 * 智谱GLM API服务实现
 */
import { BaseAIService } from './base-ai-service';
import type { MatchResult } from '../../shared/types';

export class ZhipuService extends BaseAIService {
  async analyzeCandidate(
    _imageBase64: string,
    _resumeEvaluationPrompt: string,
    _candidateInfo?: { index: number; name: string; sessionDir?: string }
  ): Promise<MatchResult> {
    throw new Error('智谱GLM服务暂未实现');
  }
  
  async testApiKey(): Promise<{ valid: boolean; error?: string; quotaExceeded?: boolean }> {
    return { valid: false, error: '智谱GLM服务暂未实现' };
  }
}

