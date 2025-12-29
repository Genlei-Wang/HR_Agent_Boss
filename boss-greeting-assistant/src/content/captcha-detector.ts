/**
 * 验证码检测器
 */
import { DOM_SELECTORS } from './dom-selectors';
import { MessageType } from '../shared/message-types';

/**
 * 验证码检测器
 */
export class CaptchaDetector {
  private observer: MutationObserver | null = null;
  private onDetected: (() => void) | null = null;
  
  /**
   * 开始监听验证码
   */
  startMonitoring(onDetected: () => void): void {
    this.onDetected = onDetected;
    
    // 立即检测一次
    if (this.checkCaptcha()) {
      this.handleCaptchaDetected();
      return;
    }
    
    // 使用MutationObserver监听DOM变化
    this.observer = new MutationObserver(() => {
      if (this.checkCaptcha()) {
        this.handleCaptchaDetected();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  
  /**
   * 停止监听
   */
  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.onDetected = null;
  }
  
  /**
   * 检查是否存在验证码
   */
  private checkCaptcha(): boolean {
    // 检查验证码弹窗
    const captchaModal = document.querySelector(DOM_SELECTORS.CAPTCHA_MODAL);
    const captchaContainer = document.querySelector(DOM_SELECTORS.CAPTCHA_CONTAINER);
    
    if (captchaModal || captchaContainer) {
      return true;
    }
    
    // 检查常见的验证码文本
    const bodyText = document.body.innerText;
    if (
      bodyText.includes('请完成验证') ||
      bodyText.includes('安全验证') ||
      bodyText.includes('滑动验证')
    ) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 处理验证码检测
   */
  private handleCaptchaDetected(): void {
    console.warn('[CaptchaDetector] Captcha detected!');
    
    // 停止监听
    this.stopMonitoring();
    
    // 通知Side Panel
    chrome.runtime.sendMessage({
      type: MessageType.CAPTCHA_DETECTED,
      payload: { message: '检测到验证码，已暂停运行' },
    });
    
    // 执行回调
    if (this.onDetected) {
      this.onDetected();
    }
  }
}

