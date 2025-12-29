/**
 * 工具函数
 */

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机延迟时间（秒转毫秒）
 */
export function randomDelay(min: number, max: number): number {
  return (min + Math.random() * (max - min)) * 1000;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 导出日志为TXT
 */
export function exportLogsToTxt(logs: any[], stats: any): string {
  const header = `Boss招聘智能助手 - 运行日志
导出时间: ${formatTimestamp(Date.now())}
运行统计: 处理${stats.processed}人, 匹配${stats.matched}人, 打招呼${stats.greeted}人

========================================
`;

  const logEntries = logs.map(log => {
    const time = formatTimestamp(log.timestamp);
    const info = `${log.candidateInfo.age || ''} | ${log.candidateInfo.education || ''} | ${log.candidateInfo.company || ''}`;
    
    return `[${time}] ${log.candidateName} | ${info}
匹配结果: ${log.matchResult ? '符合' : '不符合'} (置信度: ${log.matchConfidence.toFixed(2)})
原因: ${log.matchReason}
动作: ${getActionText(log.action)}
${log.errorMessage ? `错误: ${log.errorMessage}` : ''}
`;
  }).join('\n');

  return header + logEntries + '\n========================================';
}

/**
 * 获取动作文本
 */
function getActionText(action: string): string {
  const map: Record<string, string> = {
    greeted: '已打招呼',
    skipped: '跳过',
    error: '错误',
  };
  return map[action] || action;
}

/**
 * 下载文本文件
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 验证API Key格式
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey.length > 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
}

/**
 * 验证JD内容
 */
export function validateJobDescription(jd: string): { valid: boolean; message?: string } {
  if (!jd || jd.trim().length === 0) {
    return { valid: false, message: '请输入职位描述JD' };
  }
  
  if (jd.trim().length < 20) {
    return { valid: false, message: 'JD描述过短，可能影响匹配准确度' };
  }
  
  return { valid: true };
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
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

