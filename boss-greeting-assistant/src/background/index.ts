/**
 * Background Service Worker入口文件
 * 
 * Copyright (c) 2025 Genlei-Wang. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */
import { ScreenshotService } from './screenshot-service';
import { MessageType } from '../shared/message-types';
import type { Message, Response, AnalyzeCandidatePayload } from '../shared/message-types';
import { STORAGE_KEYS } from '../shared/constants';
import { AIServiceFactory } from '../shared/ai-service.interface';
import type { AIService, AIModelConfig } from '../shared/ai-service.interface';
import { getModelConfig } from '../shared/ai-config';
import type { PluginConfig } from '../shared/types';

// AI服务实例缓存
let aiService: AIService | null = null;

/**
 * 获取或创建AI服务实例
 * 支持多种AI模型（Gemini、通义千问、Kimi等）
 */
async function getAIService(config?: PluginConfig): Promise<AIService> {
  // 如果已有缓存且配置未变化，直接返回
  if (aiService && !config) {
    return aiService;
  }
  
  // 从存储中获取配置
  const storageResult = await chrome.storage.local.get([STORAGE_KEYS.CONFIG, STORAGE_KEYS.API_KEY]);
  const savedConfig = storageResult[STORAGE_KEYS.CONFIG] as Partial<PluginConfig> | undefined;
  const oldApiKey = storageResult[STORAGE_KEYS.API_KEY] as string | undefined;
  
  // 兼容旧版本：如果只有apiKey，使用默认Gemini配置
  let aiModelConfig: AIModelConfig;
  
  if (config?.aiModel) {
    // 使用传入的配置
    aiModelConfig = getModelConfig(config.aiModel.type, config.aiModel.apiKey);
    if (config.aiModel.model) {
      aiModelConfig.model = config.aiModel.model;
    }
  } else if (savedConfig?.aiModel) {
    // 使用保存的配置
    aiModelConfig = getModelConfig(savedConfig.aiModel.type, savedConfig.aiModel.apiKey);
    if (savedConfig.aiModel.model) {
      aiModelConfig.model = savedConfig.aiModel.model;
    }
  } else if (oldApiKey) {
    // 兼容旧版本：只有apiKey，默认使用Gemini
    aiModelConfig = getModelConfig('gemini', oldApiKey);
  } else {
    throw new Error('未配置AI模型和API Key');
  }
  
  // 创建服务实例
  aiService = await AIServiceFactory.createService(aiModelConfig);
  
  return aiService;
}

/**
 * 处理分析候选人请求
 */
async function handleAnalyzeCandidate(payload: any): Promise<Response> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:50',message:'handleAnalyzeCandidate开始',data:{hasCandidateInfo:!!payload.candidateInfo,candidateName:payload.candidateInfo?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'api-call',hypothesisId:'API_ERROR'})}).catch(()=>{});
  // #endregion
  
  try {
    // 1. 截图
    const imageBase64 = await ScreenshotService.captureArea(payload.rect);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:58',message:'截图完成',data:{imageBase64Length:imageBase64.length},timestamp:Date.now(),sessionId:'debug-session',runId:'api-call',hypothesisId:'API_ERROR'})}).catch(()=>{});
    // #endregion
    
    // 保存截图（记录到debug.log）
    if (payload.candidateInfo) {
      const { saveScreenshot } = await import('./debug-logger');
      await saveScreenshot(
        payload.candidateInfo.sessionDir || 'default',
        payload.candidateInfo.index,
        payload.candidateInfo.name,
        imageBase64
      );
      
      // 保存截图和缩略图到本地文件
      try {
        const { saveScreenshotWithThumbnail } = await import('./file-saver');
        await saveScreenshotWithThumbnail(
          imageBase64,
          payload.candidateInfo.name,
          payload.candidateInfo.index,
          payload.candidateInfo.sessionDir || 'default'
        );
      } catch (error: any) {
        console.error('[Background] 保存截图文件失败:', error);
        // 不抛出错误，避免影响主流程
      }
    }
    
    // 2. 调用AI服务分析
    const service = await getAIService(payload.config);
    const result = await service.analyzeCandidate(
      imageBase64,
      payload.jobDescription,
      payload.candidateInfo
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:84',message:'AI分析成功',data:{match:result.match,confidence:result.confidence,reasonLength:result.reason?.length,highlightsCount:result.highlights?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'api-call',hypothesisId:'API_ERROR'})}).catch(()=>{});
    // #endregion
    
    // 返回结果时包含截图数据（Base64，不包含data:image前缀）
    return {
      success: true,
      result: {
        ...result,
        screenshotBase64: imageBase64, // 返回截图数据供前端使用
      },
    };
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:95',message:'AI分析失败',data:{errorMessage:error.message,errorName:error.name,errorStack:error.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'api-call',hypothesisId:'API_ERROR'})}).catch(()=>{});
    // #endregion
    
    console.error('[Background] Analyze candidate failed:', error);
    return {
      success: false,
      error: error.message || '分析失败',
    };
  }
}

/**
 * 处理测试API Key请求
 */
async function handleTestApiKey(payload: { 
  apiKey: string; 
  modelType?: 'gemini' | 'qwen' | 'kimi' | 'deepseek' | 'wenxin' | 'zhipu';
  model?: string;
}): Promise<Response> {
  try {
    // 兼容旧版本：如果没有指定模型类型，默认使用Gemini
    const modelType = payload.modelType || 'gemini';
    const aiModelConfig = getModelConfig(modelType, payload.apiKey);
    if (payload.model) {
      aiModelConfig.model = payload.model;
    }
    
    const service = await AIServiceFactory.createService(aiModelConfig);
    const testResult = await service.testApiKey();
    
    if (testResult.valid) {
      // 缓存新的服务实例
      aiService = service;
      
      // 保存配置到storage（新格式）
      const savedConfig = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
      const config = (savedConfig[STORAGE_KEYS.CONFIG] || {}) as Partial<PluginConfig>;
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.CONFIG]: {
          ...config,
          aiModel: {
            type: modelType,
            apiKey: payload.apiKey,
            model: payload.model,
          },
        },
        // 兼容旧版本
        [STORAGE_KEYS.API_KEY]: payload.apiKey,
      });
      
      return {
        success: true,
        result: { valid: true },
      };
    } else {
      return {
        success: false,
        error: testResult.error || 'API Key无效',
        result: { quotaExceeded: testResult.quotaExceeded },
      };
    }
  } catch (error: any) {
    console.error('[Background] Test API Key failed:', error);
    return {
      success: false,
      error: error.message || 'API Key测试失败',
    };
  }
}

/**
 * 通过executeScript在页面上下文获取候选人列表
 */
async function getCandidatesFromPage(): Promise<Response> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return { success: false, error: '无法获取当前标签页' };
    }
    
    // 关键修复：allFrames: true - 在所有frames中执行
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        // 这个函数会在页面的所有frames上下文中执行
        const cards1 = document.querySelectorAll('ul.card-list li.card-item');
        if (cards1.length > 0) {
          return { count: cards1.length, method: 'ul.card-list', frameUrl: window.location.href };
        }
        
        const cards2 = document.querySelectorAll('li.card-item');
        if (cards2.length > 0) {
          return { count: cards2.length, method: 'global li.card-item', frameUrl: window.location.href };
        }
        
        const recommendList = document.querySelector('#recommend-list');
        if (recommendList) {
          const lis = recommendList.querySelectorAll('li');
          if (lis.length > 0) {
            return { count: lis.length, method: '#recommend-list li', frameUrl: window.location.href };
          }
        }
        
        return { count: 0, method: 'none', frameUrl: window.location.href };
      },
    });
    
    // 从所有frame的结果中找到候选人数量最多的
    let bestResult = { count: 0, method: 'none', frameUrl: '' };
    for (const result of results) {
      if (result.result && result.result.count > bestResult.count) {
        bestResult = result.result;
      }
    }
    
    return {
      success: true,
      result: bestResult,
    };
  } catch (error: any) {
    console.error('[Background] getCandidatesFromPage failed:', error);
    return {
      success: false,
      error: error.message || '获取失败',
    };
  }
}

/**
 * 执行页面DOM操作
 */
async function executePageAction(action: string, payload: any): Promise<Response> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return { success: false, error: '无法获取当前标签页' };
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      args: [action, payload],
      func: async (action, payload) => {
        // 点击第N个候选人卡片
        if (action === 'CLICK_CARD') {
          const cards = document.querySelectorAll('li.card-item');
          const card = cards[payload.index];
          if (card) {
            const inner = card.querySelector('.card-inner') as HTMLElement;
            if (inner) {
              inner.click();
              return { success: true, clicked: true };
            }
          }
          return { success: false, error: '未找到候选人卡片' };
        }
        
        // 点击打招呼按钮 - 只在详情页弹窗中查找
        if (action === 'CLICK_GREET') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:191',message:'CLICK_GREET开始',data:{action},timestamp:Date.now(),sessionId:'debug-session',runId:'selector-analysis',hypothesisId:'BUTTON_STATE'})}).catch(()=>{});
          // #endregion
          
          // 先检查是否在详情页Dialog中
          const dialog = document.querySelector('[class*="dialog-lib-resume"]');
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:196',message:'Dialog查找结果',data:{hasDialog:!!dialog,dialogId:dialog?.id,dialogClasses:dialog?.className,frameUrl:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'selector-analysis',hypothesisId:'SELECTOR_STABILITY'})}).catch(()=>{});
          // #endregion
          
          if (!dialog) {
            // 如果没有dialog，说明不在详情页frame中，跳过
            return { success: false, error: '当前frame无详情页Dialog，跳过' };
          }
          
          // 尝试多种选择器策略查找按钮
          // 策略1: 查找"打招呼"按钮（btn-greet类）
          const greetButton1 = dialog.querySelector('button.btn-greet') as HTMLButtonElement;
          const greetButton2 = dialog.querySelector('button.btn-sure-v2.btn-greet') as HTMLButtonElement;
          const greetButton3 = dialog.querySelector('button.btn-v2.btn-sure-v2.btn-greet') as HTMLButtonElement;
          
          // 策略2: 查找"继续沟通"按钮（已打过招呼的状态）
          const continueButton = dialog.querySelector('button.btn-outline-v2') as HTMLButtonElement;
          
          // 策略3: 通过文本内容查找
          const allButtons = dialog.querySelectorAll('button');
          const buttonsByText: any[] = [];
          allButtons.forEach((btn, idx) => {
            const text = btn.textContent?.trim() || '';
            if (text.includes('打招呼') || text.includes('继续沟通')) {
              buttonsByText.push({
                index: idx,
                text: text,
                classes: btn.className,
                disabled: btn.disabled,
                outerHTML: btn.outerHTML.substring(0, 200), // 截取前200字符
              });
            }
          });
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:220',message:'按钮查找结果',data:{greetButton1:!!greetButton1,greetButton1Text:greetButton1?.textContent?.trim(),greetButton1Classes:greetButton1?.className,greetButton1Disabled:greetButton1?.disabled,greetButton2:!!greetButton2,greetButton2Text:greetButton2?.textContent?.trim(),greetButton2Classes:greetButton2?.className,greetButton2Disabled:greetButton2?.disabled,greetButton3:!!greetButton3,greetButton3Text:greetButton3?.textContent?.trim(),greetButton3Classes:greetButton3?.className,greetButton3Disabled:greetButton3?.disabled,continueButton:!!continueButton,continueButtonText:continueButton?.textContent?.trim(),continueButtonClasses:continueButton?.className,continueButtonDisabled:continueButton?.disabled,buttonsByText},timestamp:Date.now(),sessionId:'debug-session',runId:'selector-analysis',hypothesisId:'BUTTON_STATE'})}).catch(()=>{});
          // #endregion
          
          // 优先使用策略1的结果
          const button = greetButton1 || greetButton2 || greetButton3;
          
          const debugInfo = {
            frameUrl: window.location.href,
            hasDialog: !!dialog,
            dialogId: dialog.id,
            dialogClasses: dialog.className,
            buttonFound: !!button,
            buttonDisabled: button?.disabled,
            buttonText: button?.textContent?.trim(),
            buttonClasses: button?.className,
            continueButtonFound: !!continueButton,
            continueButtonText: continueButton?.textContent?.trim(),
            allMatchingButtons: buttonsByText,
          };
          
          console.log('[executePageAction] CLICK_GREET debug:', debugInfo);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:245',message:'CLICK_GREET决策',data:debugInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'selector-analysis',hypothesisId:'BUTTON_STATE'})}).catch(()=>{});
          // #endregion
          
          // 如果找到"继续沟通"按钮，说明已经打过招呼，返回成功但标记为已打招呼
          if (continueButton && continueButton.textContent?.trim().includes('继续沟通')) {
            return { success: true, clicked: false, alreadyGreeted: true, debug: debugInfo };
          }
          
          if (button && !button.disabled) {
            button.click();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:255',message:'按钮已点击',data:{buttonText:button.textContent?.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'selector-analysis',hypothesisId:'BUTTON_STATE'})}).catch(()=>{});
            // #endregion
            return { success: true, clicked: true, debug: debugInfo };
          }
          return { success: false, error: '未找到打招呼按钮或按钮已禁用', debug: debugInfo };
        }
        
        // 关闭详情页 - 只在有Dialog的frame中执行
        if (action === 'CLOSE_DETAIL') {
          const dialog = document.querySelector('[class*="dialog-lib-resume"]');
          if (!dialog) {
            return { success: false, error: '当前frame无Dialog，跳过' };
          }
          
          const closeBtn = document.querySelector('.icon-close') as HTMLElement;
          if (closeBtn) {
            closeBtn.click();
            return { success: true, closed: true };
          }
          // 尝试按ESC
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          return { success: true, closed: true };
        }
        
        // 获取候选人信息
        if (action === 'GET_CANDIDATE_INFO') {
          const cards = document.querySelectorAll('li.card-item');
          const card = cards[payload.index];
          if (card) {
            const name = card.querySelector('.name')?.textContent?.trim() || '未知';
            const baseInfo = card.querySelector('.base-info')?.textContent?.trim() || '';
            return { success: true, info: { name, baseInfo } };
          }
          return { success: false, error: '未找到候选人' };
        }
        
        // 获取Canvas位置 - 获取整个详情页Dialog内容区域的位置（工作经历区域）
        if (action === 'GET_CANVAS_RECT') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:400',message:'GET_CANVAS_RECT开始-NEW_CODE',data:{action,frameUrl:window.location.href,codeVersion:'v2'},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'CODE_VERSION'})}).catch(()=>{});
          // #endregion
          
          const dialog = document.querySelector('[class*="dialog-lib-resume"]');
          const frameUrl = window.location.href;
          const isResumeFrame = frameUrl.includes('/c-resume/');
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:410',message:'Frame信息',data:{hasDialog:!!dialog,dialogId:dialog?.id,dialogClasses:dialog?.className,frameUrl,isResumeFrame},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'CANVAS_LOCATION'})}).catch(()=>{});
          // #endregion
          
          // 策略：在主页面frame中查找Dialog的左侧内容区域（包含候选人信息的区域）
          if (dialog && !isResumeFrame) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:415',message:'进入主页面frame处理逻辑',data:{hasDialog:!!dialog,isResumeFrame},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'MAIN_FRAME_LOGIC'})}).catch(()=>{});
            // #endregion
            
            const dialogRect = dialog.getBoundingClientRect();
            
            // 查找左侧目录栏（side-wrap），用于确定截图起点
            // 用户要求：截图起点应该是左侧目录栏的右上角
            // 关键：目录栏在主frame中，不在Dialog所在的frame中！
            // 需要使用window.top或window.parent来访问主frame
            let sidebar: HTMLElement | null = null;
            let sidebarRect: DOMRect | null = null;
            const selectors = [
              '#wrap > div.side-wrap.side-wrap-v2',
              'div.side-wrap.side-wrap-v2',
              '.side-wrap-v2',
              '.side-wrap',
              '#wrap div.side-wrap',
              'body > div.side-wrap'
            ];
            
            // 策略1：在当前frame中查找
            for (const selector of selectors) {
              sidebar = document.querySelector(selector) as HTMLElement;
              if (sidebar) {
                // #region agent log
                const sidebarFoundData = {
                  selector: selector,
                  hasSidebar: !!sidebar,
                  sidebarId: sidebar?.id,
                  sidebarClasses: sidebar?.className,
                  foundIn: 'currentFrame'
                };
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'找到目录栏（当前frame）',data:sidebarFoundData,timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_LOCATION'})}).catch(()=>{});
                // #endregion
                break;
              }
            }
            
            // 策略2：如果当前frame没找到，尝试在主frame（window.top）中查找
            if (!sidebar && window.top && window.top !== window) {
              try {
                const topDoc = window.top.document;
                for (const selector of selectors) {
                  sidebar = topDoc.querySelector(selector) as HTMLElement;
                  if (sidebar) {
                    // #region agent log
                    const sidebarFoundData = {
                      selector: selector,
                      hasSidebar: !!sidebar,
                      sidebarId: sidebar?.id,
                      sidebarClasses: sidebar?.className,
                      foundIn: 'topFrame'
                    };
                    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'找到目录栏（top frame）',data:sidebarFoundData,timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_LOCATION'})}).catch(()=>{});
                    // #endregion
                    break;
                  }
                }
              } catch (e) {
                // 跨域访问失败，忽略
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'无法访问top frame（跨域）',data:{error:(e as Error).message},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_LOCATION'})}).catch(()=>{});
                // #endregion
              }
            }
            
            // 获取目录栏的rect（需要考虑frame的位置和缩放）
            if (sidebar) {
              try {
                // 关键：如果目录栏在top frame中，getBoundingClientRect()返回的是相对于浏览器视口的坐标
                // 如果目录栏在当前frame中，getBoundingClientRect()返回的是相对于当前frame视口的坐标
                sidebarRect = sidebar.getBoundingClientRect();
                
                // 如果目录栏在top frame中，坐标已经是相对于浏览器视口的，可以直接使用
                // 但需要考虑devicePixelRatio和页面缩放
                if (window.top && window.top !== window && sidebar.ownerDocument === window.top.document) {
                  // 目录栏在top frame中，getBoundingClientRect()返回的坐标已经是相对于浏览器视口的
                  // 但chrome.tabs.captureVisibleTab()捕获的图片尺寸会受到devicePixelRatio影响
                  // 所以坐标也需要乘以devicePixelRatio
                  // 注意：getBoundingClientRect()已经考虑了缩放，但captureVisibleTab()的坐标系统可能不同
                  // 先记录日志，看看实际效果
                  
                  // #region agent log
                  const topFrameInfo = {
                    sidebarRectInTopFrame: {
                      x: sidebarRect.x,
                      y: sidebarRect.y,
                      width: sidebarRect.width,
                      height: sidebarRect.height,
                      right: sidebarRect.right,
                      bottom: sidebarRect.bottom
                    },
                    topFrameViewport: {
                      width: window.top.innerWidth,
                      height: window.top.innerHeight
                    },
                    currentFrameViewport: {
                      width: window.innerWidth,
                      height: window.innerHeight
                    },
                    devicePixelRatio: window.devicePixelRatio || 1,
                    pageZoom: (window.top as any).visualViewport?.scale || 1
                  };
                  fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'目录栏在top frame中的坐标信息',data:topFrameInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_COORDINATES'})}).catch(()=>{});
                  // #endregion
                } else {
                  // 目录栏在当前frame中，坐标是相对于当前frame视口的
                  // 需要考虑当前frame相对于浏览器视口的位置
                  // #region agent log
                  const currentFrameInfo = {
                    sidebarRectInCurrentFrame: {
                      x: sidebarRect.x,
                      y: sidebarRect.y,
                      width: sidebarRect.width,
                      height: sidebarRect.height,
                      right: sidebarRect.right,
                      bottom: sidebarRect.bottom
                    },
                    currentFrameViewport: {
                      width: window.innerWidth,
                      height: window.innerHeight
                    },
                    devicePixelRatio: window.devicePixelRatio || 1
                  };
                  fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'目录栏在当前frame中的坐标信息',data:currentFrameInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_COORDINATES'})}).catch(()=>{});
                  // #endregion
                }
              } catch (e) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'获取目录栏rect失败',data:{error:(e as Error).message},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_LOCATION'})}).catch(()=>{});
                // #endregion
              }
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:432',message:'查找左侧目录栏',data:{hasSidebar:!!sidebar,hasSidebarRect:!!sidebarRect,triedSelectors:selectors,sidebarRect:sidebarRect?{x:sidebarRect.x,y:sidebarRect.y,width:sidebarRect.width,height:sidebarRect.height,right:sidebarRect.right,bottom:sidebarRect.bottom}:null,dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height,right:dialogRect.right,bottom:dialogRect.bottom},frameUrl:window.location.href,isTopFrame:window.top===window,hasTopFrame:!!window.top},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SIDEBAR_LOCATION'})}).catch(()=>{});
            // #endregion
            
            // 查找Dialog内的布局容器（resume-layout-wrap）
            const layoutWrap = dialog.querySelector('.resume-layout-wrap') as HTMLElement;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:417',message:'查找布局容器',data:{hasLayoutWrap:!!layoutWrap,layoutWrapChildren:layoutWrap?.children?.length,layoutWrapChildrenClasses:Array.from(layoutWrap?.children || []).map((c:any)=>c.className)},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            
            // 查找resume-middle-wrap（根据DOM信息，这是实际包含iframe的容器）
            const middleWrap = layoutWrap?.querySelector('.resume-middle-wrap') as HTMLElement;
            
            // 查找左侧内容区域（包含候选人信息的区域）
            // 尝试多种选择器找到左侧内容区域
            // 注意：左侧内容区域可能直接包含iframe，或者是一个包装div
            const leftContentArea = layoutWrap?.querySelector('.resume-left-side') as HTMLElement ||
                                  layoutWrap?.querySelector('[class*="left"]') as HTMLElement ||
                                  dialog.querySelector('.resume-left-side') as HTMLElement ||
                                  dialog.querySelector('[class*="left-side"]') as HTMLElement;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:425',message:'查找内容区域',data:{hasLeftContentArea:!!leftContentArea,hasMiddleWrap:!!middleWrap,middleWrapRect:middleWrap?{x:middleWrap.getBoundingClientRect().x,y:middleWrap.getBoundingClientRect().y,width:middleWrap.getBoundingClientRect().width,height:middleWrap.getBoundingClientRect().height}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            
            // 查找iframe（c-resume）在Dialog中的位置
            // iframe包含Canvas（工作经历区域）
            const iframe = dialog.querySelector('iframe[src*="c-resume"]') as HTMLIFrameElement;
            
            let finalRect: DOMRect;
            
            if (iframe) {
              const iframeRect = iframe.getBoundingClientRect();
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:335',message:'找到iframe',data:{iframeRect:{x:iframeRect.x,y:iframeRect.y,width:iframeRect.width,height:iframeRect.height},iframeSrc:iframe.src,dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height},hasLeftContentArea:!!leftContentArea,leftContentAreaRect:leftContentArea?{x:leftContentArea.getBoundingClientRect().x,y:leftContentArea.getBoundingClientRect().y,width:leftContentArea.getBoundingClientRect().width,height:leftContentArea.getBoundingClientRect().height}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'IFRAME_LOCATION'})}).catch(()=>{});
              // #endregion
              
              // 尝试访问iframe内容，获取Canvas的实际尺寸和位置
              let canvasInfo: { width: number; height: number; scrollHeight: number } | null = null;
              if (iframe.contentWindow) {
                try {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                  const canvas = iframeDoc.querySelector('#resume') as HTMLCanvasElement;
                  if (canvas) {
                    // 获取Canvas的实际尺寸（考虑transform）
                    const canvasStyle = window.getComputedStyle(canvas);
                    const canvasRect = canvas.getBoundingClientRect();
                    
                    // 关键修复：优先使用Canvas的实际高度属性（canvas.height）
                    // 根据用户提供的信息：
                    // - Canvas实际尺寸：width="1220" height="1634"（canvas.width/height属性）
                    // - Canvas显示尺寸：width: 610px; height: 817px（CSS样式）
                    // - 应该使用canvas.height（1634px）而不是canvasRect.height（817px）
                    // 获取容器的scrollHeight作为备选
                    const container = canvas.parentElement || canvas;
                    const containerScrollHeight = container.scrollHeight;
                    
                    // 优先使用Canvas的实际高度（canvas.height），这是Canvas元素的真实高度
                    // canvas.height是Canvas的实际像素高度，不受CSS缩放影响
                    const actualCanvasHeight = canvas.height || containerScrollHeight || canvasRect.height;
                    
                    canvasInfo = {
                      width: canvas.width || canvasRect.width, // 使用Canvas实际宽度
                      height: canvasRect.height, // 显示高度（用于定位）
                      scrollHeight: actualCanvasHeight // 实际高度（用于截图，1634px）
                    };
                    
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:345',message:'Canvas信息',data:{canvasId:canvas.id,canvasRect:{x:canvasRect.x,y:canvasRect.y,width:canvasRect.width,height:canvasRect.height},canvasWidth:canvas.width,canvasHeight:canvas.height,actualCanvasHeight,containerScrollHeight,scrollHeight:actualCanvasHeight,transform:canvasStyle.transform},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'CANVAS_IN_IFRAME'})}).catch(()=>{});
                    // #endregion
                  }
                } catch (e) {
                  // 跨域访问失败，忽略
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:365',message:'无法访问iframe内容（可能跨域）',data:{error:(e as Error).message},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-scroll',hypothesisId:'CANVAS_SCROLL'})}).catch(()=>{});
                  // #endregion
                }
              }
              
              // 获取视口大小
              const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
              const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
              
              // 检测系统缩放和网页缩放
              const devicePixelRatio = window.devicePixelRatio || 1;
              let pageZoom = 1;
              try {
                if (window.visualViewport && window.visualViewport.scale) {
                  pageZoom = window.visualViewport.scale;
                }
              } catch (e) {
                pageZoom = 1;
              }
              
              // 计算截图区域
              // 优先使用middle-wrap的rect，其次左侧内容区域，最后使用iframe的rect
              let screenshotX: number;
              let screenshotY: number;
              let screenshotWidth: number;
              let screenshotHeight: number;
              let calculationStrategy = 'unknown';
              
              if (middleWrap) {
                // 策略1：使用resume-middle-wrap的rect（最准确，根据DOM信息）
                const middleRect = middleWrap.getBoundingClientRect();
                screenshotX = middleRect.x;
                screenshotY = middleRect.y;
                screenshotWidth = middleRect.width;
                screenshotHeight = middleRect.height;
                calculationStrategy = 'middle_wrap';
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:495',message:'使用middle-wrap计算',data:{middleRect:{x:middleRect.x,y:middleRect.y,width:middleRect.width,height:middleRect.height},screenshotX,screenshotY,screenshotWidth,screenshotHeight,iframeRect:{x:iframeRect.x,y:iframeRect.y,width:iframeRect.width,height:iframeRect.height}},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
              } else if (leftContentArea) {
                // 策略2：使用左侧内容区域的rect
                const leftRect = leftContentArea.getBoundingClientRect();
                screenshotX = leftRect.x;
                screenshotY = leftRect.y;
                screenshotWidth = leftRect.width;
                screenshotHeight = leftRect.height;
                calculationStrategy = 'left_content_area';
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:505',message:'使用左侧内容区域计算',data:{leftRect:{x:leftRect.x,y:leftRect.y,width:leftRect.width,height:leftRect.height},screenshotX,screenshotY,screenshotWidth,screenshotHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'LEFT_CONTENT_AREA'})}).catch(()=>{});
                // #endregion
              } else {
                // 策略3：使用iframe的rect
                screenshotX = iframeRect.x;
                screenshotY = iframeRect.y;
                screenshotWidth = iframeRect.width;
                screenshotHeight = iframeRect.height;
                calculationStrategy = 'iframe';
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:515',message:'使用iframe位置计算',data:{iframeRect:{x:iframeRect.x,y:iframeRect.y,width:iframeRect.width,height:iframeRect.height},screenshotX,screenshotY,screenshotWidth,screenshotHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'IFRAME_FALLBACK'})}).catch(()=>{});
                // #endregion
              }
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:520',message:'截图区域初始计算',data:{calculationStrategy,screenshotX,screenshotY,screenshotWidth,screenshotHeight,viewportWidth,viewportHeight,iframeHeight:iframeRect.height,canvasInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'H2'})}).catch(()=>{});
              // #endregion
              
              // 确保截图区域在视口范围内
              // 根据DOM信息，Dialog在(0,0)，所以x和y应该都是0或正数
              // 如果起点在视口外，调整到视口内
              if (screenshotX < 0) {
                screenshotWidth = screenshotWidth + screenshotX; // 减少宽度
                screenshotX = 0;
              }
              if (screenshotY < 0) {
                screenshotHeight = screenshotHeight + screenshotY; // 减少高度
                screenshotY = 0;
              }
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:550',message:'视口边界检查后-BEFORE_FIX',data:{screenshotX,screenshotY,screenshotWidth,screenshotHeight,dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height},iframeRect:{x:iframeRect.x,y:iframeRect.y,width:iframeRect.width,height:iframeRect.height},calculationStrategy,canvasInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'BEFORE_FIX'})}).catch(()=>{});
              // #endregion
              
              // ========== 强制修复：无论使用什么策略，都使用Dialog的完整宽度和Canvas的完整高度 ==========
              // 根据DOM信息和用户反馈，必须强制使用：
              // 1. Dialog的完整宽度（891px或963px，取决于分辨率），而不是iframe的宽度（537px或609px）
              // 2. Canvas/iframe的完整高度（4688px或2522px），而不是视口高度
              // 3. x坐标使用左侧目录栏的右边界（右上角），而不是Dialog的x（0）
              
              // 关键修复：截图起点应该是左侧目录栏的右上角
              // 重要：chrome.tabs.captureVisibleTab()捕获的是整个浏览器视口，坐标系统需要考虑：
              // - 如果目录栏在top frame中，getBoundingClientRect()返回的坐标已经是相对于浏览器视口的
              // - 如果目录栏在当前frame中，需要考虑当前frame相对于浏览器视口的位置
              // - 但captureVisibleTab()的坐标系统可能受到devicePixelRatio影响
              
              if (sidebarRect) {
                // 使用目录栏的右边界作为截图起点
                // 关键：如果目录栏在top frame中，sidebarRect.right已经是相对于浏览器视口的坐标
                // 如果目录栏在当前frame中，需要考虑frame的位置
                let sidebarRightInViewport = sidebarRect.right;
                
                // 如果目录栏在top frame中，坐标已经是相对于浏览器视口的，可以直接使用
                // 如果目录栏在当前frame中，需要加上当前frame相对于浏览器视口的位置
                if (window.top && window.top !== window && sidebar && sidebar.ownerDocument === window.top.document) {
                  // 目录栏在top frame中，坐标已经是相对于浏览器视口的
                  sidebarRightInViewport = sidebarRect.right;
                } else {
                  // 目录栏在当前frame中，需要考虑当前frame的位置
                  // 但getBoundingClientRect()返回的坐标已经是相对于浏览器视口的（如果frame没有偏移）
                  // 先使用sidebarRect.right，看看效果
                  sidebarRightInViewport = sidebarRect.right;
                }
                
                screenshotX = sidebarRightInViewport;
                // 宽度 = Dialog右边界 - 目录栏右边界
                // 注意：Dialog的rect是相对于当前frame的，但我们需要相对于浏览器视口的坐标
                // 如果Dialog在当前frame中，且frame没有偏移，dialogRect.right也是相对于浏览器视口的
                screenshotWidth = dialogRect.right - sidebarRightInViewport;
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:680',message:'目录栏坐标转换',data:{sidebarRect:{x:sidebarRect.x,y:sidebarRect.y,width:sidebarRect.width,height:sidebarRect.height,right:sidebarRect.right},sidebarRightInViewport,dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height,right:dialogRect.right},screenshotX,screenshotWidth,isTopFrame:window.top===window,sidebarInTopFrame:window.top && window.top !== window && sidebar && sidebar.ownerDocument === window.top.document},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'COORDINATE_CONVERSION'})}).catch(()=>{});
                // #endregion
              } else {
                // 如果没有找到目录栏，使用Dialog的x和宽度（fallback）
                screenshotX = dialogRect.x;
                screenshotWidth = dialogRect.width;
              }
              
              // 强制使用Canvas/iframe的完整高度
              // 关键：使用Canvas的实际高度（canvas.height），而不是显示高度
              // 根据用户信息：Canvas实际高度1634px，显示高度817px
              const MAX_SCREENSHOT_HEIGHT = 10000; // 最大高度限制，防止过大
              if (canvasInfo && canvasInfo.scrollHeight) {
                // 使用Canvas的实际高度（canvas.height），这是完整内容高度
                screenshotHeight = Math.min(canvasInfo.scrollHeight, MAX_SCREENSHOT_HEIGHT);
              } else if (iframeRect.height) {
                // 如果没有Canvas信息，使用iframe的高度
                screenshotHeight = Math.min(iframeRect.height, MAX_SCREENSHOT_HEIGHT);
              } else {
                // 最后的备选：使用Dialog高度（但这不是完整内容）
                screenshotHeight = Math.min(dialogRect.height, MAX_SCREENSHOT_HEIGHT);
              }
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:570',message:'强制修复后-FINAL_VALUES',data:{screenshotX,screenshotY,screenshotWidth,screenshotHeight,dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height},iframeRect:{x:iframeRect.x,y:iframeRect.y,width:iframeRect.width,height:iframeRect.height},canvasInfo,calculationStrategy,viewportWidth,viewportHeight,devicePixelRatio,pageZoom},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'FINAL_FIX'})}).catch(()=>{});
              // #endregion
              
              // 注意：不再限制宽度为视口宽度，因为Dialog宽度可能大于视口宽度
              // chrome.tabs.captureVisibleTab()会自动处理超出视口的部分
              
              // 确保最小尺寸（安全检查）
              if (screenshotWidth < 100) {
                screenshotWidth = Math.max(100, dialogRect.width);
              }
              if (screenshotHeight < 100) {
                screenshotHeight = Math.max(100, iframeRect.height || dialogRect.height);
              }
              
              // 创建最终的DOMRect对象
              finalRect = new DOMRect(screenshotX, screenshotY, screenshotWidth, screenshotHeight);
            } else {
              // 如果没有iframe，使用Dialog的内容区域
              const contentArea = dialog.querySelector('.boss-popup__content') as HTMLElement || dialog;
              const contentRect = contentArea.getBoundingClientRect();
              finalRect = contentRect;
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:430',message:'使用Dialog内容区域（无iframe）',data:{dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height},contentRect:{x:contentRect.x,y:contentRect.y,width:contentRect.width,height:contentRect.height}},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'DIALOG_FALLBACK'})}).catch(()=>{});
              // #endregion
            }
            
            // 获取视口大小（用于日志和滚动计算）
            const viewportWidthForLog = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeightForLog = window.innerHeight || document.documentElement.clientHeight;
            
            // ========== 关键修复：getBoundingClientRect()返回的是相对于视口的坐标！==========
            // getBoundingClientRect()返回的坐标已经是相对于当前视口的，不需要减去scrollX/scrollY
            // chrome.tabs.captureVisibleTab()捕获的也是当前视口的内容
            // 所以rect的坐标可以直接使用，不需要调整！
            
            // 但是，如果rect不在视口内（比如y < 0或y > viewportHeight），需要滚动
            // 滚动后，getBoundingClientRect()会返回新的相对于视口的坐标
            
            let adjustedRect = finalRect;
            
            // 检查rect是否在视口内
            const rectTop = finalRect.y;
            const rectBottom = finalRect.y + finalRect.height;
            const rectLeft = finalRect.x;
            const rectRight = finalRect.x + finalRect.width;
            
            // 如果rect不在视口内，滚动使rect的起始位置在视口内
            if (rectTop < 0 || rectTop > viewportHeightForLog || rectLeft < 0 || rectLeft > viewportWidthForLog) {
              // 滚动到rect的起始位置
              window.scrollTo({
                top: Math.max(0, rectTop),
                left: Math.max(0, rectLeft),
                behavior: 'instant'
              });
              
              // 等待滚动完成
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // 重新获取rect（滚动后，坐标会更新为相对于新视口）
              // 但这里我们直接使用finalRect，因为getBoundingClientRect()已经返回相对于视口的坐标
              // 滚动后，如果Dialog在视口内，rect的坐标应该就是相对于视口的
              adjustedRect = finalRect;
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:640',message:'rect不在视口内，已滚动',data:{originalRect:{x:finalRect.x,y:finalRect.y,width:finalRect.width,height:finalRect.height},rectTop,rectBottom,rectLeft,rectRight,viewportWidth:viewportWidthForLog,viewportHeight:viewportHeightForLog},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'SCROLL_FIX'})}).catch(()=>{});
              // #endregion
            }
            
            // 关键：getBoundingClientRect()返回的坐标已经是相对于视口的，直接使用即可
            // 不需要减去scrollX/scrollY！
            
            // #region agent log
            const iframeRectForLog = iframe ? iframe.getBoundingClientRect() : null;
            fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:660',message:'最终截图区域（已调整）',data:{originalRect:{x:finalRect.x,y:finalRect.y,width:finalRect.width,height:finalRect.height},adjustedRect:{x:adjustedRect.x,y:adjustedRect.y,width:adjustedRect.width,height:adjustedRect.height},dialogRect:{x:dialogRect.x,y:dialogRect.y,width:dialogRect.width,height:dialogRect.height},iframeRect:iframeRectForLog,hasIframe:!!iframe,hasLeftContentArea:!!leftContentArea,hasMiddleWrap:!!middleWrap,viewportWidth:viewportWidthForLog,viewportHeight:viewportHeightForLog,pageScrollX:window.scrollX||window.pageXOffset||0,pageScrollY:window.scrollY||window.pageYOffset||0},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            
            // 检查区域是否可见
            if (adjustedRect.width === 0 || adjustedRect.height === 0) {
              return { success: false, error: `截图区域尺寸为0 (${adjustedRect.width}x${adjustedRect.height})` };
            }
            
            return {
              success: true,
              rect: {
                x: adjustedRect.x,
                y: adjustedRect.y,
                width: adjustedRect.width,
                height: adjustedRect.height,
              },
            };
          }
          
          // 如果在resume frame中，查找Canvas元素（作为fallback）
          if (isResumeFrame) {
            const canvas1 = document.querySelector('#resume') as HTMLElement;
            const canvas2 = document.querySelector('canvas#resume') as HTMLCanvasElement;
            const canvas3 = document.querySelector('canvas') as HTMLCanvasElement;
            const canvas = canvas2 || canvas3 || canvas1;
            
            if (canvas) {
              // Boss反爬机制：Canvas会随滚动动态加载
              const container = canvas.parentElement || canvas;
              if (container && container.scrollHeight > container.clientHeight) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:395',message:'Resume frame Canvas可滚动，开始滚动',data:{scrollHeight:container.scrollHeight,clientHeight:container.clientHeight,canvasId:canvas.id},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-scroll',hypothesisId:'CANVAS_SCROLL'})}).catch(()=>{});
                // #endregion
                container.scrollTop = container.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, 1500));
                container.scrollTop = container.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              const rect = canvas.getBoundingClientRect();
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:405',message:'Resume frame Canvas位置',data:{canvasId:canvas.id,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}},timestamp:Date.now(),sessionId:'debug-session',runId:'canvas-analysis',hypothesisId:'CANVAS_LOCATION'})}).catch(()=>{});
              // #endregion
              
              if (rect.width === 0 || rect.height === 0) {
                return { success: false, error: `Canvas元素尺寸为0 (${rect.width}x${rect.height})` };
              }
              
              // 注意：在iframe中，rect是相对于iframe的，需要转换为页面坐标
              // 但这里我们无法直接获取iframe在页面中的位置，所以返回相对坐标
              // 实际使用时，应该在主页面frame中查找iframe的位置
              return {
                success: true,
                rect: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                },
              };
            }
            
            return { success: false, error: 'Resume frame中未找到Canvas元素' };
          }
          
          // 其他frame如果没有Dialog，跳过
          if (!dialog) {
            return { success: false, error: '当前frame无Dialog且非resume frame，跳过' };
          }
          
          return { success: false, error: '未找到Dialog内容区域' };
        }
        
        return { success: false, error: '未知操作' };
      },
    });
    
    // 优先返回主页面frame（有Dialog的frame）的结果，而不是resume frame的结果
    // 因为主页面frame的rect是相对于整个页面的正确坐标，而resume frame的rect是相对于iframe的
    let mainFrameResult: any = null;
    let resumeFrameResult: any = null;
    let otherResults: any[] = [];
    
    for (const result of results) {
      if (result.result && result.result.success) {
        const rect = result.result.rect;
        if (rect) {
          // 通过rect的x坐标判断：主页面frame的x应该是200左右（已经向右移动），resume frame的x是0
          if (rect.x > 100) {
            // x坐标大于100，说明是主页面frame的结果（已经向右移动了）
            mainFrameResult = result.result;
          } else if (rect.x === 0 && rect.width <= 650) {
            // x坐标是0且宽度较小，说明是resume frame的结果
            resumeFrameResult = result.result;
          } else {
            otherResults.push(result.result);
          }
        } else {
          otherResults.push(result.result);
        }
      }
    }
    
    // 优先返回主页面frame的结果
    if (mainFrameResult) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:610',message:'返回主页面frame的结果',data:{rect:mainFrameResult.rect},timestamp:Date.now(),sessionId:'debug-session',runId:'frame-selection',hypothesisId:'FRAME_PRIORITY'})}).catch(()=>{});
      // #endregion
      return { success: true, result: mainFrameResult };
    }
    
    // 如果没有主页面frame的结果，使用其他结果
    if (otherResults.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:620',message:'返回其他frame的结果',data:{rect:otherResults[0].rect},timestamp:Date.now(),sessionId:'debug-session',runId:'frame-selection',hypothesisId:'FRAME_PRIORITY'})}).catch(()=>{});
      // #endregion
      return { success: true, result: otherResults[0] };
    }
    
    // 最后才使用resume frame的结果（作为fallback）
    if (resumeFrameResult) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'background/index.ts:628',message:'返回resume frame的结果（fallback）',data:{rect:resumeFrameResult.rect},timestamp:Date.now(),sessionId:'debug-session',runId:'frame-selection',hypothesisId:'FRAME_PRIORITY'})}).catch(()=>{});
      // #endregion
      return { success: true, result: resumeFrameResult };
    }
    
    // 如果所有frame都失败或跳过，返回最后一个非跳过的错误，或默认错误
    for (const result of results) {
      if (result.result && !result.result.success && result.result.error && !result.result.error.includes('跳过')) {
        return { success: false, error: result.result.error };
      }
    }
    
    return { success: false, error: '操作失败：所有frame都未找到目标元素' };
  } catch (error: any) {
    console.error('[Background] executePageAction failed:', error);
    return { success: false, error: error.message || '操作失败' };
  }
}

/**
 * 消息监听器
 */
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  
  switch (message.type) {
    case MessageType.ANALYZE_CANDIDATE:
      // 分析候选人
      handleAnalyzeCandidate(message.payload as AnalyzeCandidatePayload)
        .then(sendResponse)
        .catch(error => {
          console.error('[Background] Handler error:', error);
          sendResponse({
            success: false,
            error: error.message || '处理失败',
          });
        });
      break;
      
    case MessageType.TEST_API_KEY:
      // 测试API Key
      handleTestApiKey(message.payload as { apiKey: string })
        .then(sendResponse)
        .catch(error => {
          console.error('[Background] Handler error:', error);
          sendResponse({
            success: false,
            error: error.message || '测试失败',
          });
        });
      break;
      
    case MessageType.GET_CANDIDATES_FROM_PAGE:
      // 通过executeScript获取候选人
      getCandidatesFromPage()
        .then(sendResponse)
        .catch(error => {
          console.error('[Background] Handler error:', error);
          sendResponse({
            success: false,
            error: error.message || '获取失败',
          });
        });
      break;
      
    case MessageType.CLICK_CARD:
    case MessageType.CLICK_GREET:
    case MessageType.CLOSE_DETAIL:
    case MessageType.GET_CANDIDATE_INFO:
    case MessageType.GET_CANVAS_RECT:
      // 执行页面DOM操作
      executePageAction(message.type, message.payload)
        .then(sendResponse)
        .catch(error => {
          console.error('[Background] Handler error:', error);
          sendResponse({
            success: false,
            error: error.message || '操作失败',
          });
        });
      break;
      
    default:
      sendResponse({
        success: false,
        error: `Unknown message type: ${message.type}`,
      });
  }
  
  // 返回true表示将异步发送响应
  return true;
});

/**
 * 处理扩展图标点击事件 - 打开侧边栏
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Background] Extension icon clicked');
  
  if (!tab.id) {
    console.error('[Background] No tab id found');
    return;
  }
  
  try {
    // 打开侧边栏
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('[Background] Side panel opened');
  } catch (error) {
    console.error('[Background] Failed to open side panel:', error);
    
    // 如果打开失败，尝试设置侧边栏路径后再打开
    try {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: 'src/sidepanel/index.html',
        enabled: true
      });
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (retryError) {
      console.error('[Background] Retry failed:', retryError);
    }
  }
});

/**
 * 扩展安装/更新时执行
 */
chrome.runtime.onInstalled.addListener(details => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装时的初始化
    console.log('[Background] First time installation');
    
    // 设置默认的侧边栏
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => {
      console.error('[Background] Failed to set panel behavior:', error);
    });
  } else if (details.reason === 'update') {
    // 更新时的处理
    console.log('[Background] Extension updated');
  }
});

console.log('[Background] Boss Greeting Assistant service worker loaded');

