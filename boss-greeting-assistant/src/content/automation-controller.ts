/**
 * 自动化控制器
 * 
 * Copyright (c) 2025 Genlei-Wang. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */
import { MessageType } from '../shared/message-types';
import type { PluginConfig, OperationLog } from '../shared/types';
import { generateId } from '../shared/utils';
import { DEFAULT_CONFIG } from '../shared/constants';

/**
 * 自动化控制器
 */
export class AutomationController {
  private isRunning = false;
  private stats = {
    processed: 0,
    matched: 0,
    greeted: 0,
    skipped: 0,
  };
  private sessionDir = '';
  private lastScreenshotBase64?: string; // 存储最后一次截图的Base64数据
  
  /**
   * 开始自动化
   */
  async start(_config: PluginConfig): Promise<void> {
    // 检查是否已在运行
    if (this.isRunning) {
      console.warn('[AutomationController] Already running');
      return;
    }
    
    this.isRunning = true;
    
    // 创建本次会话目录
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.sessionDir = `session_${timestamp}`;
    
    console.log('[AutomationController] Starting automation');
    console.log('[AutomationController] Session:', this.sessionDir);
    
    // 通知Side Panel创建新的session
    try {
      await chrome.runtime.sendMessage({
        type: MessageType.CREATE_SESSION,
        payload: {},
      });
    } catch (error) {
      console.error('[AutomationController] Failed to create session:', error);
    }
    
    // 更新状态
    this.sendStatusUpdate('running');
    
    try {
      await this.runAutomation(_config);
      
      // 完成
      this.sendStatusUpdate('completed');
    } catch (error: any) {
      console.error('[AutomationController] Error:', error);
      this.sendError(error.message || '自动化运行失败');
    } finally {
      this.stop();
    }
  }
  
  /**
   * 停止自动化
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('[AutomationController] Stopping automation');
    
    this.isRunning = false;
    
    // 保存当前session
    chrome.runtime.sendMessage({
      type: MessageType.SAVE_SESSION,
      payload: {},
    }).catch(error => {
      console.error('[AutomationController] Failed to save session:', error);
    });
    
    this.sendStatusUpdate('idle');
  }
  
  /**
   * 运行自动化流程
   */
  private async runAutomation(config: PluginConfig): Promise<void> {
    console.log('[AutomationController] Starting automation...');
    
    // 获取候选人列表
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_CANDIDATES_FROM_PAGE,
    });
    
    if (!response.success || !response.result || response.result.count === 0) {
      throw new Error('未找到候选人列表');
    }
    
    const candidateCount = response.result.count;
    const candidateCountLimit = config.candidateCount ?? DEFAULT_CONFIG.CANDIDATE_COUNT;
    const targetCount = Math.min(candidateCountLimit, candidateCount);
    
    console.log(`[AutomationController] ✅ 找到 ${candidateCount} 个候选人，将处理 ${targetCount} 个`);
    
    // 重置统计
    this.stats = { processed: 0, matched: 0, greeted: 0, skipped: 0 };
    
    // 逐个处理候选人
    for (let i = 0; i < targetCount; i++) {
      if (!this.isRunning) {
        console.log('[AutomationController] Stopped by user');
        break;
      }
      
      console.log(`[AutomationController] Processing candidate ${i + 1}/${targetCount}`);
      
      try {
        await this.processCandidate(i, config);
        this.stats.processed += 1;
        this.sendStatsUpdate();
        
        // 候选人间隔延迟
        if (i < targetCount - 1) {
          const delayRange = config.delayRange || {
            min: DEFAULT_CONFIG.DELAY_MIN,
            max: DEFAULT_CONFIG.DELAY_MAX,
          };
          const minDelay = delayRange.min ?? DEFAULT_CONFIG.DELAY_MIN;
          const maxDelay = delayRange.max ?? DEFAULT_CONFIG.DELAY_MAX;
          const delay = minDelay + Math.random() * (maxDelay - minDelay);
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
      } catch (error: any) {
        console.error(`[AutomationController] Failed to process candidate ${i + 1}:`, error);
        
        const errorLog: OperationLog = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          candidateName: `候选人${i + 1}`,
          candidateInfo: {},
          matchResult: false,
          matchConfidence: 0,
          matchReason: '',
          action: 'error',
          errorMessage: error.message,
        };
        
        this.sendLogUpdate(errorLog);
      }
    }
    
    console.log('[AutomationController] Automation completed');
  }
  
  /**
   * 处理单个候选人
   */
  private async processCandidate(index: number, config: PluginConfig): Promise<void> {
    // 1. 获取候选人信息
    const infoResponse = await chrome.runtime.sendMessage({
      type: MessageType.GET_CANDIDATE_INFO,
      payload: { index },
    });
    
    const candidateName = infoResponse.result?.info?.name || `候选人${index + 1}`;
    const candidateBaseInfo = infoResponse.result?.info?.baseInfo || '';
    console.log(`[AutomationController] Processing: ${candidateName}`);
    
    // 2. 随机延迟后点击候选人卡片
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3秒
    
    const clickResponse = await chrome.runtime.sendMessage({
      type: MessageType.CLICK_CARD,
      payload: { index },
    });
    
    if (!clickResponse.success) {
      throw new Error('点击候选人卡片失败');
    }
    
    // 3. 等待详情页加载
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // 1.5-2.5秒
    
    // 4. 获取Canvas位置（带重试机制）
    let rectResponse: any = null;
    const maxRetries = 5;
    const retryDelay = 1000; // 1秒
    
    for (let retry = 0; retry < maxRetries; retry++) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:163',message:'尝试获取Canvas位置',data:{candidateIndex:index,candidateName,retry,maxRetries},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-retry',hypothesisId:'CANVAS_LOADING'})}).catch(()=>{});
      // #endregion
      
      rectResponse = await chrome.runtime.sendMessage({
        type: MessageType.GET_CANVAS_RECT,
        payload: {},
      });
      
      if (rectResponse.success && rectResponse.result?.rect) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:175',message:'Canvas位置获取成功',data:{candidateIndex:index,candidateName,retry,rect:rectResponse.result.rect},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-retry',hypothesisId:'CANVAS_LOADING'})}).catch(()=>{});
        // #endregion
        break;
      }
      
      if (retry < maxRetries - 1) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:182',message:'Canvas未找到，等待重试',data:{candidateIndex:index,candidateName,retry,error:rectResponse.error,nextRetryIn:retryDelay},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-retry',hypothesisId:'CANVAS_LOADING'})}).catch(()=>{});
        // #endregion
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    let matchResult = false;
    let confidence = 0;
    let reason = '';
    
    if (rectResponse && rectResponse.success && rectResponse.result?.rect) {
      // 5. 截图并AI分析
      try {
        const analyzeResponse = await chrome.runtime.sendMessage({
          type: MessageType.ANALYZE_CANDIDATE,
          payload: {
            rect: rectResponse.result.rect,
            jobDescription: config.jobDescription,
            candidateInfo: {
              index,
              name: candidateName,
              sessionDir: this.sessionDir,
            },
          },
        });
        
        if (analyzeResponse.success && analyzeResponse.result) {
          matchResult = analyzeResponse.result.match;
          confidence = analyzeResponse.result.confidence;
          reason = analyzeResponse.result.reason;
          
          // 保存截图数据到临时变量，稍后添加到日志中
          this.lastScreenshotBase64 = analyzeResponse.result.screenshotBase64;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:241',message:'AI分析成功，保存截图数据',data:{candidateName,hasScreenshot:!!analyzeResponse.result.screenshotBase64,screenshotLength:analyzeResponse.result.screenshotBase64?.length,matchResult,confidence},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-save',hypothesisId:'SCREENSHOT_SAVE'})}).catch(()=>{});
          // #endregion
          
          console.log(`[AutomationController] AI分析结果: ${matchResult ? '匹配' : '不匹配'} (${(confidence * 100).toFixed(0)}%)`);
      } else {
        reason = 'AI分析失败，默认不匹配';
        this.lastScreenshotBase64 = undefined;
      }
    } catch (error: any) {
      console.error('[AutomationController] AI分析异常:', error);
      reason = `AI分析异常: ${error.message}`;
      this.lastScreenshotBase64 = undefined;
    }
  } else {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:201',message:'Canvas未找到，记录错误',data:{candidateIndex:index,candidateName,rectResponse:rectResponse?{success:rectResponse.success,error:rectResponse.error,debug:rectResponse.debug}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-retry',hypothesisId:'CANVAS_LOADING'})}).catch(()=>{});
    // #endregion
    reason = `未找到Canvas元素，默认不匹配${rectResponse?.error ? `: ${rectResponse.error}` : ''}`;
  }
    
    // 6. 根据匹配结果打招呼
    if (matchResult) {
      console.log(`[AutomationController] ${candidateName} 匹配成功，准备打招呼`);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:207',message:'准备打招呼',data:{candidateIndex:index,candidateName,matchResult,confidence},timestamp:Date.now(),sessionId:'debug-session',runId:'greet-logic',hypothesisId:'GREET'})}).catch(()=>{});
      // #endregion
      
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const greetResponse = await chrome.runtime.sendMessage({
        type: MessageType.CLICK_GREET,
        payload: {},
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:221',message:'打招呼响应',data:{candidateIndex:index,candidateName,success:greetResponse.success,error:greetResponse.error,debug:greetResponse.result?.debug},timestamp:Date.now(),sessionId:'debug-session',runId:'greet-logic',hypothesisId:'GREET'})}).catch(()=>{});
      // #endregion
      
      if (greetResponse.success) {
        this.stats.greeted += 1;
        this.stats.matched += 1;
        console.log(`[AutomationController] ${candidateName} 打招呼成功`);
      } else {
        console.warn(`[AutomationController] ${candidateName} 打招呼失败:`, greetResponse.error);
        this.stats.skipped += 1;
        reason = '打招呼失败: ' + greetResponse.error;
      }
    } else {
      console.log(`[AutomationController] ${candidateName} 不匹配，跳过`);
      this.stats.skipped += 1;
    }
    
    // 7. 关闭详情页
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    await chrome.runtime.sendMessage({
      type: MessageType.CLOSE_DETAIL,
      payload: {},
    });
    
    // 8. 发送日志
    const log: OperationLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      candidateName,
      candidateInfo: {
        age: candidateBaseInfo.split('|')[0]?.trim() || '',
        education: candidateBaseInfo.split('|')[2]?.trim() || '',
      },
      matchResult,
      matchConfidence: confidence,
      matchReason: reason,
      action: matchResult ? 'greeted' : 'skipped',
      screenshotBase64: this.lastScreenshotBase64, // 添加截图数据
    };
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'automation-controller.ts:317',message:'创建日志，包含截图数据',data:{candidateName,hasScreenshot:!!this.lastScreenshotBase64,screenshotLength:this.lastScreenshotBase64?.length,logId:log.id},timestamp:Date.now(),sessionId:'debug-session',runId:'log-creation',hypothesisId:'SCREENSHOT_SAVE'})}).catch(()=>{});
    // #endregion
    
    // 清空截图数据，为下一个候选人准备
    this.lastScreenshotBase64 = undefined;
    
    this.sendLogUpdate(log);
  }
  
  
  /**
   * 发送日志更新
   */
  private sendLogUpdate(log: OperationLog): void {
    this.sendMessage(MessageType.LOG_UPDATE, { log });
  }
  
  /**
   * 发送统计更新
   */
  private sendStatsUpdate(): void {
    this.sendMessage(MessageType.STATS_UPDATE, { stats: this.stats });
  }
  
  /**
   * 发送状态更新
   */
  private sendStatusUpdate(status: string): void {
    this.sendMessage(MessageType.STATUS_UPDATE, { status });
  }
  
  /**
   * 发送错误消息
   */
  private sendError(message: string): void {
    this.sendMessage(MessageType.ERROR_OCCURRED, { message });
  }
  
  /**
   * 发送消息到Side Panel
   */
  private sendMessage(type: MessageType, payload?: any): void {
    chrome.runtime.sendMessage({ type, payload }).catch(error => {
      console.error('[AutomationController] Failed to send message:', error);
    });
  }
}

