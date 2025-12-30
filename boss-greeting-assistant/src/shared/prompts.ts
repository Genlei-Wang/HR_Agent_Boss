/**
 * AI Prompts配置
 */

/**
 * 系统Prompt（简化版，减少tokens消耗）
 */
export const SYSTEM_PROMPT = `你是资深的HR招聘专家，请根据JD要求，分析候选人的工作经历截图，判断匹配程度。评判：学历、工作经历、年限等。仅输出JSON。满足90%要求才匹配。`;

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
