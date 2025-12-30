/**
 * 消息类型定义
 */

/**
 * 消息类型枚举
 */
export enum MessageType {
  // Side Panel -> Content Script
  START_AUTOMATION = 'START_AUTOMATION',
  STOP_AUTOMATION = 'STOP_AUTOMATION',
  PAUSE_AUTOMATION = 'PAUSE_AUTOMATION',
  RESUME_AUTOMATION = 'RESUME_AUTOMATION',
  
  // Content Script -> Background
  ANALYZE_CANDIDATE = 'ANALYZE_CANDIDATE',
  TEST_API_KEY = 'TEST_API_KEY',
  CAPTURE_SCREENSHOT = 'CAPTURE_SCREENSHOT',
  GET_CANDIDATES_FROM_PAGE = 'GET_CANDIDATES_FROM_PAGE',
  CLICK_CARD = 'CLICK_CARD',
  CLICK_GREET = 'CLICK_GREET',
  CLOSE_DETAIL = 'CLOSE_DETAIL',
  GET_CANDIDATE_INFO = 'GET_CANDIDATE_INFO',
  GET_CANVAS_RECT = 'GET_CANVAS_RECT',
  SCROLL_TO_LOAD_CANDIDATES = 'SCROLL_TO_LOAD_CANDIDATES',
  
  // Background -> Side Panel
  LOG_UPDATE = 'LOG_UPDATE',
  STATUS_UPDATE = 'STATUS_UPDATE',
  STATS_UPDATE = 'STATS_UPDATE',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  
  // Content Script -> Side Panel
  CAPTCHA_DETECTED = 'CAPTCHA_DETECTED',
  AUTOMATION_COMPLETE = 'AUTOMATION_COMPLETE',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  
  // Session管理
  CREATE_SESSION = 'CREATE_SESSION',
  SAVE_SESSION = 'SAVE_SESSION',
}

/**
 * 消息基类
 */
export interface Message<T = any> {
  type: MessageType | string;
  payload?: T;
}

/**
 * 响应基类
 */
export interface Response<T = any> {
  success: boolean;
  result?: T;
  error?: string;
}

/**
 * 分析候选人消息payload
 */
export interface AnalyzeCandidatePayload {
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  resumeEvaluationPrompt: string; // 简历评估提示词（包含角色和JD要求）
  candidateInfo?: { index: number; name: string; sessionDir?: string };
  config?: import('./types').PluginConfig; // AI模型配置
}

/**
 * 日志更新消息payload
 */
export interface LogUpdatePayload {
  log: import('./types').OperationLog;
}

/**
 * 统计更新消息payload
 */
export interface StatsUpdatePayload {
  stats: Partial<import('./types').AppStats>;
}

/**
 * 状态更新消息payload
 */
export interface StatusUpdatePayload {
  status: import('./types').AppStatus;
  message?: string;
}

