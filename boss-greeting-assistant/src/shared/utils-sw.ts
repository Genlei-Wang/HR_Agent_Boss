/**
 * Service Worker 专用工具函数
 * 这些函数不依赖DOM API，可以在Service Worker中使用
 */

/**
 * 从文本中提取JSON
 */
export function extractJson(text: string): any | null {
  try {
    // 尝试直接解析
    return JSON.parse(text);
  } catch {
    // 尝试提取JSON部分
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 安全地解析JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * 验证API Key格式
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey.length > 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
}

/**
 * 验证简历评估提示词
 */
export function validateResumeEvaluationPrompt(prompt: string): { valid: boolean; message?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, message: '请输入简历评估提示词' };
  }
  
  if (prompt.trim().length < 20) {
    return { valid: false, message: '提示词过短，可能影响匹配准确度' };
  }
  
  return { valid: true };
}

/**
 * 验证JD内容（兼容旧版本）
 * @deprecated 使用 validateResumeEvaluationPrompt() 替代
 */
export function validateJobDescription(jd: string): { valid: boolean; message?: string } {
  return validateResumeEvaluationPrompt(jd);
}

