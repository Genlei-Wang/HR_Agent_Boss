/**
 * 共享类型定义
 */

/**
 * 插件配置
 */
export interface PluginConfig {
  // AI模型配置
  aiModel: {
    type: 'gemini' | 'qwen' | 'kimi' | 'deepseek' | 'wenxin' | 'zhipu';
    apiKey: string;
    model?: string; // 可选：指定具体模型（如 qwen-vl-plus）
  };
  
  // 兼容旧版本：保留apiKey字段
  apiKey?: string; // 已废弃，使用aiModel.apiKey
  
  // 功能配置
  candidateCount?: number; // 允许为空，支持删除
  jobDescription: string;
  delayRange?: {
    min?: number; // 允许为空
    max?: number; // 允许为空
  };
  enableMouseSimulation: boolean;
  
  // 功能开关
  features: {
    autoGreet: boolean; // 自动打招呼
    autoRequestResume: boolean; // 自动要简历（沟通列表）
    autoAcceptResume: boolean; // 自动接收简历（沟通列表）
  };
}

/**
 * 候选人信息
 */
export interface CandidateInfo {
  id: string;
  name: string;
  age: string;
  workYears: string;
  education: string;
  status: string;
  workExperience: string[];
  educationHistory: string[];
  tags: string[];
  description: string;
}

/**
 * AI匹配结果
 */
export interface MatchResult {
  match: boolean;
  confidence: number;
  reason: string;
  highlights: string[];
}

/**
 * 操作日志
 */
export interface OperationLog {
  id: string;
  timestamp: string;
  candidateName: string;
  candidateInfo: {
    age?: string;
    education?: string;
    company?: string;
    position?: string;
  };
  matchResult: boolean;
  matchConfidence: number;
  matchReason: string;
  action: 'greeted' | 'skipped' | 'error';
  errorMessage?: string;
  screenshotBase64?: string; // Canvas截图数据（Base64格式，不包含data:image前缀）
}

/**
 * 每日统计
 */
export interface DailyStats {
  date: string;
  totalProcessed: number;
  totalMatched: number;
  totalGreeted: number;
  totalSkipped: number;
  totalErrors: number;
}

/**
 * 延迟配置
 */
export interface DelayConfig {
  min: number;
  max: number;
}

/**
 * 应用状态
 */
export type AppStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

/**
 * 应用统计
 */
export interface AppStats {
  processed: number;
  matched: number;
  greeted: number;
  skipped: number;
}

/**
 * 运行会话日志
 */
export interface SessionLog {
  sessionId: string;
  startTime: string;
  endTime?: string;
  status: AppStatus;
  stats: AppStats;
  logs: OperationLog[];
}

