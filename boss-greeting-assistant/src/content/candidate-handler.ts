/**
 * 候选人处理器
 */
import { DOM_SELECTORS, waitForElement } from './dom-selectors';
import { CandidateExtractor } from './candidate-extractor';
import { RiskControl } from './risk-control';
import { MessageType } from '../shared/message-types';
import type { OperationLog, PluginConfig } from '../shared/types';
import { generateId } from '../shared/utils';

/**
 * 候选人处理器
 */
export class CandidateHandler {
  private stopped = false;
  
  /**
   * 设置停止标志
   */
  stop(): void {
    this.stopped = true;
  }
  
  /**
   * 重置停止标志
   */
  reset(): void {
    this.stopped = false;
  }
  
  /**
   * 检查是否已停止
   */
  isStopped(): boolean {
    return this.stopped;
  }
  
  /**
   * 处理单个候选人
   */
  async processCandidate(
    cardElement: HTMLElement,
    config: PluginConfig
  ): Promise<OperationLog> {
    const log: Partial<OperationLog> = {
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    
    try {
      // 1. 提取候选人基本信息
      const candidateInfo = CandidateExtractor.extractFromCard(cardElement);
      log.candidateName = candidateInfo.name;
      log.candidateInfo = {
        age: candidateInfo.age,
        education: candidateInfo.education,
        company: candidateInfo.workExperience[0] || '',
        position: '',
      };
      
      console.log(`[CandidateHandler] Processing: ${candidateInfo.name}`);
      
      // 2. 检查是否已停止
      if (this.stopped) {
        throw new Error('用户已停止自动化');
      }
      
      // 3. 随机延迟后点击卡片
      await RiskControl.delayedAction('CLICK_CARD', async () => {
        await this.clickCard(cardElement);
      });
      
      // 4. 等待详情页加载
      await waitForElement(DOM_SELECTORS.DETAIL_DIALOG, 10000);
      const waitConfig = RiskControl.getDelayConfig('WAIT_LOAD');
      await RiskControl.randomDelay(waitConfig.min, waitConfig.max);
      
      // 5. 检查验证码
      if (RiskControl.detectCaptcha()) {
        throw new Error('检测到验证码，已暂停');
      }
      
      // 6. 截图前等待
      const screenshotConfig = RiskControl.getDelayConfig('BEFORE_SCREENSHOT');
      await RiskControl.randomDelay(screenshotConfig.min, screenshotConfig.max);
      
      // 7. 获取Canvas位置并截图
      const canvasContainer = document.querySelector(DOM_SELECTORS.RESUME_CONTAINER);
      if (!canvasContainer) {
        throw new Error('未找到简历Canvas容器');
      }
      
      const rect = canvasContainer.getBoundingClientRect();
      
      // 8. 发送消息到Background进行截图和AI分析
      const response = await chrome.runtime.sendMessage({
        type: MessageType.ANALYZE_CANDIDATE,
        payload: {
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          jobDescription: config.jobDescription,
        },
      });
      
      if (!response || response.error) {
        throw new Error(response?.error || 'AI分析失败');
      }
      
      log.matchResult = response.result.match;
      log.matchConfidence = response.result.confidence;
      log.matchReason = response.result.reason;
      
      // 9. 根据匹配结果决定是否打招呼
      if (response.result.match) {
        await RiskControl.delayedAction('CLICK_GREET', async () => {
          await this.clickGreetButton();
        });
        log.action = 'greeted';
        
        // 更新每日统计
        await RiskControl.updateDailyStats(true);
      } else {
        log.action = 'skipped';
        await RiskControl.updateDailyStats(false);
      }
      
      // 10. 关闭详情页
      await RiskControl.delayedAction('CLOSE_DETAIL', async () => {
        await this.closeDetail();
      });
      
      return log as OperationLog;
      
    } catch (error: any) {
      log.action = 'error';
      log.errorMessage = error.message || '未知错误';
      
      console.error('[CandidateHandler] Error:', error);
      
      // 尝试关闭详情页
      try {
        await this.closeDetail();
      } catch (e) {
        console.error('[CandidateHandler] Failed to close detail:', e);
      }
      
      return log as OperationLog;
    }
  }
  
  /**
   * 点击候选人卡片
   */
  private async clickCard(cardElement: HTMLElement): Promise<void> {
    const cardInner = cardElement.querySelector(DOM_SELECTORS.CARD_INNER) as HTMLElement;
    if (!cardInner) {
      throw new Error('未找到可点击的候选人卡片');
    }
    
    cardInner.click();
  }
  
  /**
   * 点击打招呼按钮
   */
  private async clickGreetButton(): Promise<void> {
    const button = document.querySelector(DOM_SELECTORS.GREET_BUTTON_IN_DETAIL) as HTMLButtonElement;
    if (!button) {
      // 可能已经打过招呼了
      console.warn('[CandidateHandler] Greet button not found');
      throw new Error('未找到打招呼按钮，可能已经打过招呼');
    }
    
    if (button.disabled) {
      throw new Error('打招呼按钮已禁用');
    }
    
    button.click();
    
    // 等待点击生效
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * 关闭详情页
   */
  private async closeDetail(): Promise<void> {
    const closeButton = document.querySelector(DOM_SELECTORS.CLOSE_BUTTON) as HTMLElement;
    if (closeButton) {
      closeButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // 尝试按ESC键关闭
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

