/**
 * Gemini API服务实现
 * 
 * Copyright (c) 2025 Genlei-Wang. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */
import { SYSTEM_PROMPT, buildUserPrompt, TEST_PROMPT } from '../../shared/prompts';
import type { MatchResult } from '../../shared/types';
import type { AIService, AIModelConfig } from '../../shared/ai-service.interface';
import { extractJson } from '../../shared/utils-sw';
import { saveAIInput, saveAIOutput } from '../debug-logger';

/**
 * Gemini AI服务实现
 */
export class GeminiService implements AIService {
  private config: AIModelConfig;
  
  constructor(config: AIModelConfig | string) {
    // 兼容旧版本：如果传入的是string（apiKey），转换为config
    if (typeof config === 'string') {
      this.config = {
        type: 'gemini',
        name: 'gemini',
        displayName: 'Google Gemini',
        apiKey: config,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        model: 'gemini-2.5-flash',
        temperature: 0.2,
        maxTokens: 8192,
        timeout: 30000,
      };
    } else {
      this.config = config;
    }
  }
  
  /**
   * 分析候选人是否匹配JD要求
   */
  async analyzeCandidate(
    imageBase64: string,
    jobDescription: string,
    candidateInfo?: { index: number; name: string; sessionDir?: string }
  ): Promise<MatchResult> {
    const userPrompt = buildUserPrompt(jobDescription);
    const combinedPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
    
    // 记录AI输入
    if (candidateInfo) {
      await saveAIInput(
        candidateInfo.sessionDir || 'default',
        candidateInfo.index,
        candidateInfo.name,
        combinedPrompt,
        imageBase64
      );
    }
    
    try {
      const response = await this.callAPI(combinedPrompt, imageBase64);
      const result = this.parseResponse(response);
      
      // 记录AI输出
      if (candidateInfo) {
        await saveAIOutput(
          candidateInfo.sessionDir || 'default',
          candidateInfo.index,
          candidateInfo.name,
          response,
          result
        );
      }
      
      return result;
    } catch (error: any) {
      console.error('[GeminiService] API call failed:', error);
      throw new Error(`Gemini API调用失败: ${error.message}`);
    }
  }
  
  /**
   * 调用Gemini API
   */
  private async callAPI(prompt: string, imageBase64?: string): Promise<any> {
    const parts: any[] = [{ text: prompt }];
    
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: imageBase64,
        },
      });
    }
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        temperature: this.config.temperature ?? 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: this.config.maxTokens ?? 8192,
      },
    };
    
    // 将API Key作为URL参数
    const apiUrl = `${this.config.endpoint}?key=${this.config.apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout ?? 30000);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GeminiService] API Error:', errorText);
        
        // 尝试解析错误信息
        try {
          const errorJson = JSON.parse(errorText);
          const errorMsg = errorJson.error?.message || errorText;
          throw new Error(`API调用失败 (${response.status}): ${errorMsg}`);
        } catch {
          throw new Error(`API调用失败 (${response.status}): ${errorText.substring(0, 200)}`);
        }
      }
      
      const data = await response.json();
      console.log('[GeminiService] API Response received');
      return data;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      
      throw error;
    }
  }
  
  /**
   * 解析AI响应
   */
  private parseResponse(data: any): MatchResult {
    try {
      // 提取文本内容
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!textContent) {
        throw new Error('AI响应为空');
      }
      
      // 提取JSON
      const jsonResult = extractJson(textContent);
      
      if (!jsonResult) {
        throw new Error('无法从AI响应中提取JSON');
      }
      
      // 验证必需字段
      if (typeof jsonResult.match !== 'boolean') {
        throw new Error('AI响应缺少match字段或格式错误');
      }
      
      return {
        match: jsonResult.match,
        confidence: jsonResult.confidence || 0.5,
        reason: jsonResult.reason || '未提供原因',
        highlights: Array.isArray(jsonResult.highlights) ? jsonResult.highlights : [],
      };
      
    } catch (error: any) {
      console.error('[GeminiService] Failed to parse response:', error);
      console.error('[GeminiService] Raw data:', data);
      
      // 降级策略：默认不匹配
      return {
        match: false,
        confidence: 0,
        reason: `解析AI响应失败: ${error.message}`,
        highlights: [],
      };
    }
  }
  
  /**
   * 测试API Key是否有效
   */
  async testApiKey(): Promise<{ valid: boolean; error?: string; quotaExceeded?: boolean }> {
    try {
      console.log('[GeminiService] Testing API Key...');
      const result = await this.callAPI(TEST_PROMPT);
      console.log('[GeminiService] API Key test successful:', result);
      return { valid: true };
    } catch (error: any) {
      console.error('[GeminiService] API Key test failed:', error);
      console.error('[GeminiService] Error details:', error.message);
      
      // 检查是否是配额超限错误
      const isQuotaExceeded = error.message?.includes('429') || 
                              error.message?.includes('quota') || 
                              error.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaExceeded) {
        return { 
          valid: false, 
          error: 'API配额已用完（免费版每天20次请求）\n\n请等待配额恢复（约1小时后）或升级API计划',
          quotaExceeded: true 
        };
      }
      
      return { 
        valid: false, 
        error: error.message || 'API Key测试失败',
        quotaExceeded: false 
      };
    }
  }
}

