/**
 * AI Prompts配置
 */

/**
 * 系统Prompt（简化版，减少tokens消耗）
 */
export const SYSTEM_PROMPT = `你是HR助手，根据JD分析候选人截图，判断是否匹配。评判：技能、行业、年限、项目经验。仅输出JSON，满足60%要求即匹配。`;

/**
 * 构建用户Prompt（简化版）
 */
export function buildUserPrompt(jobDescription: string): string {
  return `JD要求：${jobDescription}

分析图片中的候选人，输出JSON：
{"match":true/false,"confidence":0-1,"reason":"原因（30字内）","highlights":["点1","点2"]}`;
}

/**
 * 测试API Key的简单Prompt
 */
export const TEST_PROMPT = 'Hello, please respond with "OK" if you are working.';

