/**
 * 风控模块
 */
import { DOM_SELECTORS } from './dom-selectors';
import { DELAY_CONFIGS, DEFAULT_CONFIG, STORAGE_KEYS } from '../shared/constants';
import type { DelayConfig } from '../shared/types';
import { getTodayString } from '../shared/utils';

/**
 * 风控控制器
 */
export class RiskControl {
  /**
   * 随机延迟
   */
  static async randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  }
  
  /**
   * 根据操作类型获取延迟配置
   */
  static getDelayConfig(operationType: keyof typeof DELAY_CONFIGS): DelayConfig {
    return DELAY_CONFIGS[operationType] || { min: 1, max: 2 };
  }
  
  /**
   * 执行带随机延迟的操作
   */
  static async delayedAction(
    operationType: keyof typeof DELAY_CONFIGS,
    action: () => Promise<void>
  ): Promise<void> {
    const config = this.getDelayConfig(operationType);
    await this.randomDelay(config.min, config.max);
    await action();
  }
  
  /**
   * 检测验证码
   */
  static detectCaptcha(): boolean {
    return !!(
      document.querySelector(DOM_SELECTORS.CAPTCHA_MODAL) ||
      document.querySelector(DOM_SELECTORS.CAPTCHA_CONTAINER)
    );
  }
  
  /**
   * 检查每日限额
   */
  static async checkDailyLimit(): Promise<{ allowed: boolean; remaining: number }> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
    const today = getTodayString();
    
    if (!result[STORAGE_KEYS.DAILY_STATS] || result[STORAGE_KEYS.DAILY_STATS].date !== today) {
      // 新的一天，重置计数
      return { allowed: true, remaining: DEFAULT_CONFIG.DAILY_LIMIT };
    }
    
    const { totalGreeted = 0 } = result[STORAGE_KEYS.DAILY_STATS];
    const remaining = Math.max(0, DEFAULT_CONFIG.DAILY_LIMIT - totalGreeted);
    
    return {
      allowed: remaining > 0,
      remaining,
    };
  }
  
  /**
   * 更新每日统计
   */
  static async updateDailyStats(greeted: boolean): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
    const today = getTodayString();
    
    let stats = result[STORAGE_KEYS.DAILY_STATS] || { date: today, totalGreeted: 0 };
    
    if (stats.date !== today) {
      stats = { date: today, totalGreeted: 0 };
    }
    
    if (greeted) {
      stats.totalGreeted += 1;
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.DAILY_STATS]: stats });
  }
  
  /**
   * 随机休息（每处理N个候选人后）
   */
  static async randomBreak(processedCount: number): Promise<void> {
    if (processedCount === 0) return;
    
    const breakInterval = DEFAULT_CONFIG.BREAK_INTERVAL_MIN + 
      Math.floor(Math.random() * (DEFAULT_CONFIG.BREAK_INTERVAL_MAX - DEFAULT_CONFIG.BREAK_INTERVAL_MIN + 1));
    
    if (processedCount % breakInterval === 0) {
      const breakTime = DEFAULT_CONFIG.BREAK_DURATION_MIN + 
        Math.random() * (DEFAULT_CONFIG.BREAK_DURATION_MAX - DEFAULT_CONFIG.BREAK_DURATION_MIN);
      
      console.log(`[RiskControl] Taking a break for ${breakTime.toFixed(1)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, breakTime * 1000));
    }
  }
  
  /**
   * 检查是否在工作时间（可选风控）
   */
  static isWorkingHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 9 && hour < 18;
  }
  
  /**
   * 初始化每日统计（如果是新的一天）
   */
  static async initDailyStats(): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DAILY_STATS);
    const today = getTodayString();
    
    if (!result[STORAGE_KEYS.DAILY_STATS] || result[STORAGE_KEYS.DAILY_STATS].date !== today) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.DAILY_STATS]: {
          date: today,
          totalGreeted: 0,
          totalProcessed: 0,
          totalMatched: 0,
          totalSkipped: 0,
          totalErrors: 0,
        },
      });
    }
  }
}

