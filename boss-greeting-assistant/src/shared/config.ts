/**
 * 环境配置
 * 用于区分开发环境和生产环境
 */

/**
 * 是否为开发环境
 * 在生产构建时会被替换为 false
 */
export const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * 是否启用调试日志
 * 仅在开发环境启用
 */
export const ENABLE_DEBUG_LOG = IS_DEV;

/**
 * 调试服务器地址
 * 仅在开发环境使用
 */
export const DEBUG_SERVER_URL = IS_DEV 
  ? 'http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f'
  : '';

/**
 * 安全日志函数
 * 在生产环境不执行任何操作
 */
export function safeDebugLog(data: {
  location: string;
  message: string;
  data?: any;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}): void {
  if (!ENABLE_DEBUG_LOG || !DEBUG_SERVER_URL) {
    return;
  }

  // 移除敏感信息
  const sanitizedData = sanitizeData(data.data || {});

  try {
    fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        data: sanitizedData,
        timestamp: data.timestamp || Date.now(),
      }),
    }).catch(() => {
      // 静默失败，不影响主流程
    });
  } catch (error) {
    // 静默失败
  }
}

/**
 * 清理敏感数据
 * 移除API Key、密码等敏感信息
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'apiKey',
    'api_key',
    'apikey',
    'password',
    'token',
    'secret',
    'authorization',
  ];

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

    if (isSensitive && typeof value === 'string') {
      // 只显示前4个字符和后4个字符
      if (value.length > 8) {
        sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      } else {
        sanitized[key] = '***';
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

