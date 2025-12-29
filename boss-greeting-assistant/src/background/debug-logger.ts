/**
 * 详细调试日志记录器
 * 记录每个候选人的截图、AI输入输出等详细信息
 */

const DEBUG_LOG_DIR = '/Users/yingdao/Documents/Project/BOSS打招呼插件/运行日志';

/**
 * 创建日志目录（通过executeScript在页面上下文执行）
 */
export async function initDebugLogDir(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = `${DEBUG_LOG_DIR}/session_${timestamp}`;
  
  console.log('[DebugLogger] Session dir:', sessionDir);
  return sessionDir;
}

/**
 * 保存候选人截图
 */
export async function saveScreenshot(
  sessionDir: string,
  candidateIndex: number,
  candidateName: string,
  base64Image: string
): Promise<void> {
  try {
    // 将base64保存到日志（因为无法直接写文件，记录到console和debug.log）
    console.log(`[DebugLogger] Screenshot for ${candidateName}:`);
    console.log(`[DebugLogger] Base64 length: ${base64Image.length}`);
    console.log(`[DebugLogger] First 100 chars: ${base64Image.substring(0, 100)}`);
    
    // 记录到debug.log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'debug-logger.ts:35',
        message: `候选人${candidateIndex} - ${candidateName} - 截图`,
        data: {
          candidateIndex,
          candidateName,
          base64Length: base64Image.length,
          base64Preview: base64Image.substring(0, 200),
        },
        timestamp: Date.now(),
        sessionId: sessionDir,
        runId: 'detailed-log',
      }),
    }).catch(() => {});
  } catch (error) {
    console.error('[DebugLogger] Failed to save screenshot:', error);
  }
}

/**
 * 保存AI输入
 */
export async function saveAIInput(
  sessionDir: string,
  candidateIndex: number,
  candidateName: string,
  prompt: string,
  base64Image: string
): Promise<void> {
  try {
    console.log(`[DebugLogger] AI Input for ${candidateName}:`);
    console.log(`[DebugLogger] Prompt: ${prompt.substring(0, 200)}...`);
    
    // 记录到debug.log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'debug-logger.ts:69',
        message: `候选人${candidateIndex} - ${candidateName} - AI输入`,
        data: {
          candidateIndex,
          candidateName,
          prompt,
          imageBase64Length: base64Image.length,
        },
        timestamp: Date.now(),
        sessionId: sessionDir,
        runId: 'detailed-log',
      }),
    }).catch(() => {});
  } catch (error) {
    console.error('[DebugLogger] Failed to save AI input:', error);
  }
}

/**
 * 保存AI输出
 */
export async function saveAIOutput(
  sessionDir: string,
  candidateIndex: number,
  candidateName: string,
  rawResponse: any,
  parsedResult: any
): Promise<void> {
  try {
    const textContent = rawResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log(`[DebugLogger] AI Output for ${candidateName}:`);
    console.log(`[DebugLogger] Raw text: ${textContent}`);
    console.log(`[DebugLogger] Parsed result:`, parsedResult);
    
    // 记录到debug.log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'debug-logger.ts:108',
        message: `候选人${candidateIndex} - ${candidateName} - AI输出`,
        data: {
          candidateIndex,
          candidateName,
          rawText: textContent,
          parsedResult,
          finishReason: rawResponse.candidates?.[0]?.finishReason,
        },
        timestamp: Date.now(),
        sessionId: sessionDir,
        runId: 'detailed-log',
      }),
    }).catch(() => {});
  } catch (error) {
    console.error('[DebugLogger] Failed to save AI output:', error);
  }
}

