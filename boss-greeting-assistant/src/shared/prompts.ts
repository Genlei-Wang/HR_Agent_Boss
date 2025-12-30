/**
 * AI Prompts配置
 */

/**
 * 默认简历评估提示词
 */
export const DEFAULT_RESUME_EVALUATION_PROMPT = '你是资深的HR招聘专家，请根据JD要求，分析候选人的工作经历截图，判断匹配程度。评判：学历、工作经历、年限等。';

/**
 * 固定的技术限制部分（不暴露给用户）
 */
const TECHNICAL_CONSTRAINTS = `仅输出JSON格式。满足90%要求才匹配。`;

/**
 * JSON输出格式说明（不暴露给用户）
 */
const JSON_FORMAT = `输出JSON格式：
{"match":true/false,"confidence":0-1,"reason":"原因（30字内）","highlights":["点1","点2"]}`;

/**
 * 构建完整的评估提示词
 * @param userPrompt 用户提供的简历评估提示词（包含角色和JD要求）
 * @returns 完整的提示词（用户提示词 + 技术限制 + JSON格式）
 */
export function buildEvaluationPrompt(userPrompt: string): string {
  const prompt = userPrompt || DEFAULT_RESUME_EVALUATION_PROMPT;
  return `${prompt} ${TECHNICAL_CONSTRAINTS}

${JSON_FORMAT}`;
}

/**
 * 测试API Key的简单Prompt
 */
export const TEST_PROMPT = 'Hello, please respond with "OK" if you are working.';
