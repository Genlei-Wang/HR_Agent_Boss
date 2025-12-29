/**
 * 常量配置
 */

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  CANDIDATE_COUNT: 50,
  DELAY_MIN: 3,
  DELAY_MAX: 8,
  DAILY_LIMIT: 100,
  BREAK_INTERVAL_MIN: 20,
  BREAK_INTERVAL_MAX: 30,
  BREAK_DURATION_MIN: 30,
  BREAK_DURATION_MAX: 60,
} as const;

/**
 * 操作延迟配置（秒）
 */
export const DELAY_CONFIGS = {
  CLICK_CARD: { min: 1, max: 3 },
  WAIT_LOAD: { min: 1, max: 2 },
  BEFORE_SCREENSHOT: { min: 0.5, max: 1 },
  CLICK_GREET: { min: 0.5, max: 1.5 },
  CLOSE_DETAIL: { min: 1, max: 3 },
  BETWEEN_CANDIDATES: { min: 3, max: 8 },
} as const;

/**
 * Gemini API配置
 * 严格按照官方示例：model="gemini-2.5-flash"
 */
export const GEMINI_CONFIG = {
  API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  TEMPERATURE: 0.2,
  TOP_K: 40,
  TOP_P: 0.95,
  MAX_OUTPUT_TOKENS: 8192, // 大幅增加，确保能完整输出JSON
  TIMEOUT: 30000, // 30秒
  MAX_RETRIES: 3,
} as const;

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  CONFIG: 'plugin_config',
  DAILY_STATS: 'daily_stats',
  LOGS: 'operation_logs',
  API_KEY: 'gemini_api_key',
  SESSION_LOGS: 'session_logs',
  CURRENT_SESSION_ID: 'current_session_id',
  SCREENSHOTS: 'candidate_screenshots', // 候选人截图存储 key: logId -> base64
} as const;

/**
 * Boss直聘页面URL模式
 */
export const BOSS_URL_PATTERNS = {
  RECOMMEND: /zhipin\.com\/web\/geek\/recommend/,
  JOB: /zhipin\.com\/web\/geek\/job/,
  CHAT: /zhipin\.com\/web\/geek\/chat/,
} as const;

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  NO_API_KEY: '请先配置Gemini API Key',
  INVALID_API_KEY: 'API Key无效，请检查后重试',
  NO_JD: '请输入职位描述JD',
  JD_TOO_SHORT: 'JD描述过短，可能影响匹配准确度',
  COUNT_EXCEEDED: '建议每日不超过100人，降低封号风险',
  NOT_BOSS_PAGE: '请在Boss直聘候选人列表页使用本插件',
  NO_CANDIDATES: '当前列表无候选人',
  CAPTCHA_DETECTED: '检测到验证码弹窗，已暂停运行，请手动处理后点击继续',
  DAILY_LIMIT_REACHED: '已达到每日打招呼上限（100次）',
  SCREENSHOT_FAILED: '截图失败，跳过当前候选人',
  API_CALL_FAILED: 'AI分析失败，跳过当前候选人',
  NETWORK_ERROR: '网络错误，请检查网络连接',
} as const;

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  API_KEY_VALID: 'API Key验证成功',
  CONFIG_SAVED: '配置保存成功',
  AUTOMATION_STARTED: '自动化已启动',
  AUTOMATION_COMPLETED: '已完成！共处理{processed}人，打招呼{greeted}人',
  LOG_EXPORTED: '日志导出成功',
} as const;

