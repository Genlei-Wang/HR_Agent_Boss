/**
 * 通义千问 (Qwen) API服务实现
 * 
 * Copyright (c) 2025 Genlei-Wang. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */
import { BaseAIService } from './base-ai-service';
import type { AIModelConfig } from '../../shared/ai-service.interface';
import type { MatchResult } from '../../shared/types';
import { TEST_PROMPT } from '../../shared/prompts';
import { saveAIInput, saveAIOutput } from '../debug-logger';

/**
 * 通义千问AI服务实现
 */
export class QwenService extends BaseAIService {
  constructor(config: AIModelConfig) {
    super(config);
  }
  
  /**
   * 分析候选人是否匹配JD要求
   */
  async analyzeCandidate(
    imageBase64: string,
    resumeEvaluationPrompt: string,
    candidateInfo?: { index: number; name: string; sessionDir?: string }
  ): Promise<MatchResult> {
    const combinedPrompt = this.buildPrompt(resumeEvaluationPrompt);
    
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
      const response = await this.callQwenAPI(combinedPrompt, imageBase64);
      const result = this.parseJsonResponse(response);
      
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
      console.error('[QwenService] API call failed:', error);
      throw new Error(`通义千问API调用失败: ${error.message}`);
    }
  }
  
  /**
   * 调用通义千问API
   */
  private async callQwenAPI(prompt: string, imageBase64?: string): Promise<string> {
    const model = this.config.model || 'qwen3-vl-plus';
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'qwen-service.ts:69',message:'callQwenAPI开始',data:{model,hasImage:!!imageBase64,imageLength:imageBase64?.length,promptLength:prompt.length,hasWindow:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'qwen-api',hypothesisId:'QWEN_API_FORMAT'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    // 构建请求体 - 根据通义千问API文档格式
    const content: any[] = [];
    
    // 添加图片（如果提供）
    if (imageBase64) {
      // 移除data:image前缀（如果存在）
      const base64Data = imageBase64.startsWith('data:image') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      
      content.push({
        image: `data:image/png;base64,${base64Data}`,
      });
    }
    
    // 添加文本提示
    content.push({
      text: prompt,
    });
    
    const requestBody = {
      model: model,
      input: {
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
      },
      parameters: {
        temperature: this.config.temperature ?? 0.2,
        max_tokens: this.config.maxTokens ?? 8192,
      },
    };
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'qwen-service.ts:95',message:'请求体构建完成',data:{model:requestBody.model,contentLength:requestBody.input.messages[0].content.length,hasImage:requestBody.input.messages[0].content.some((c:any)=>c.image)},timestamp:Date.now(),sessionId:'debug-session',runId:'qwen-api',hypothesisId:'QWEN_API_FORMAT'})}).catch(()=>{});
    } catch (e) {}
    // #endregion
    
    const apiUrl = this.config.endpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout ?? 30000);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QwenService] API Error:', errorText);
        
        // 尝试解析错误信息
        try {
          const errorJson = JSON.parse(errorText);
          const errorMsg = errorJson.message || errorJson.error?.message || errorJson.code || errorText;
          throw new Error(`API调用失败 (${response.status}): ${errorMsg}`);
        } catch {
          throw new Error(`API调用失败 (${response.status}): ${errorText.substring(0, 200)}`);
        }
      }
      
      const data = await response.json();
      console.log('[QwenService] API Response received:', JSON.stringify(data).substring(0, 500));
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'qwen-service.ts:135',message:'API响应接收',data:{hasOutput:!!data.output,hasChoices:!!data.output?.choices,responseKeys:Object.keys(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'qwen-api',hypothesisId:'QWEN_RESPONSE_PARSE'})}).catch(()=>{});
      } catch (e) {}
      // #endregion
      
      // 提取文本内容（支持多种响应格式）
      let textContent = '';
      
      // 格式1: output.choices[0].message.content (通义千问标准格式)
      if (data.output?.choices?.[0]?.message?.content) {
        const content = data.output.choices[0].message.content;
        // content可能是字符串或数组
        if (typeof content === 'string') {
          textContent = content;
        } else if (Array.isArray(content)) {
          // 如果是数组，提取所有text字段
          textContent = content.map((item: any) => item.text || item).join('\n');
        }
      }
      // 格式2: output.text
      else if (data.output?.text) {
        textContent = data.output.text;
      }
      // 格式3: output.choices[0].message.text
      else if (data.output?.choices?.[0]?.message?.text) {
        textContent = data.output.choices[0].message.text;
      }
      // 格式4: 直接text字段
      else if (data.text) {
        textContent = data.text;
      }
      // 格式5: output.choices[0].text
      else if (data.output?.choices?.[0]?.text) {
        textContent = data.output.choices[0].text;
      }
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'qwen-service.ts:165',message:'文本提取结果',data:{hasTextContent:!!textContent,textContentLength:textContent.length,textPreview:textContent.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'qwen-api',hypothesisId:'QWEN_RESPONSE_PARSE'})}).catch(()=>{});
      } catch (e) {}
      // #endregion
      
      if (!textContent) {
        console.error('[QwenService] Response structure:', JSON.stringify(data, null, 2));
        throw new Error('AI响应为空，无法提取文本内容。响应结构：' + JSON.stringify(data).substring(0, 500));
      }
      
      return textContent;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      
      throw error;
    }
  }
  
  /**
   * 测试API Key是否有效
   */
  async testApiKey(): Promise<{ valid: boolean; error?: string; quotaExceeded?: boolean }> {
    try {
      console.log('[QwenService] Testing API Key...');
      const result = await this.callQwenAPI(TEST_PROMPT);
      console.log('[QwenService] API Key test successful:', result);
      return { valid: true };
    } catch (error: any) {
      console.error('[QwenService] API Key test failed:', error);
      console.error('[QwenService] Error details:', error.message);
      
      // 检查是否是配额超限错误
      const isQuotaExceeded = error.message?.includes('429') || 
                              error.message?.includes('quota') || 
                              error.message?.includes('RESOURCE_EXHAUSTED') ||
                              error.message?.includes('配额') ||
                              error.message?.includes('限流');
      
      if (isQuotaExceeded) {
        return { 
          valid: false, 
          error: 'API配额已用完或限流\n\n请等待配额恢复或检查API Key权限',
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

