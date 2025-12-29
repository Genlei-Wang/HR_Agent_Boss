/**
 * Boss直聘DOM选择器配置
 */

/**
 * DOM选择器常量
 * 基于实际DOM结构更新 - 2025-12-19
 */
export const DOM_SELECTORS = {
  // 候选人列表页
  LIST_CONTAINER: '#recommend-list > div > ul',  // 直接的ul容器
  CARD_LIST: 'ul.card-list',
  CARD_ITEM: 'li.card-item',
  CARD_INNER: '.card-inner.common-wrap',
  CARD_INFO_COL: '.col-2',
  
  // 候选人基本信息
  CANDIDATE_NAME: '.name-wrap .name',
  ACTIVE_STATUS: '.active-text',
  BASE_INFO: '.base-info.join-text-wrap',
  GEEK_DESC: '.geek-desc .content',
  TAGS: '.tags-wrap .tag-item',
  
  // 工作与教育经历
  WORK_TIMELINE: '.timeline-wrap.work-exps',
  EDU_TIMELINE: '.timeline-wrap.edu-exps',
  TIMELINE_ITEM: '.timeline-item',
  
  // 详情页（弹窗）
  DETAIL_DIALOG: '[class*="dialog-lib-resume"]',
  DIALOG_WRAPPER: '.boss-dialog__wrapper',
  RESUME_CONTAINER: '#resume',
  RESUME_CANVAS: 'canvas#resume',
  
  // 操作按钮
  GREET_BUTTON_IN_LIST: 'button.btn-greet',
  // 详情页打招呼按钮：使用多种类名组合以提高稳定性
  // 注意：避免使用动态ID（如boss-dynamic-dialog-xxx），使用相对路径从Dialog查找
  GREET_BUTTON_IN_DETAIL: 'button.btn-greet, button.btn-sure-v2.btn-greet, button.btn-v2.btn-sure-v2.btn-greet',
  // "继续沟通"按钮：点击"打招呼"后按钮会变成此状态，表示已打过招呼
  CONTINUE_BUTTON_IN_DETAIL: 'button.btn-outline-v2',
  CLOSE_BUTTON: '.boss-popup__close .icon-close, .icon-close',
  
  // 风控相关
  CAPTCHA_MODAL: '[class*="captcha"]',
  CAPTCHA_CONTAINER: '#captcha-container',
} as const;

/**
 * 获取候选人唯一ID
 */
export function getCandidateId(cardElement: HTMLElement): string | null {
  const cardInner = cardElement.querySelector(DOM_SELECTORS.CARD_INNER);
  return cardInner?.getAttribute('data-geekid') || null;
}

/**
 * 等待元素出现
 */
export function waitForElement(
  selector: string,
  timeout: number = 10000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * 检查当前页面是否为Boss直聘候选人列表页
 * 改为检测DOM元素而非URL，更灵活
 */
export function isCandidateListPage(): boolean {
  // 首先检查是否在Boss直聘域名
  const url = window.location.href;
  if (!url.includes('zhipin.com')) {
    return false;
  }
  
  // 检查是否存在候选人列表容器
  const listContainer = document.querySelector(DOM_SELECTORS.LIST_CONTAINER);
  if (listContainer) {
    return true;
  }
  
  // 检查是否存在候选人卡片
  const cardItems = document.querySelectorAll(DOM_SELECTORS.CARD_ITEM);
  if (cardItems.length > 0) {
    return true;
  }
  
  // 如果URL包含相关关键词，也认为是候选人页面（兼容未来可能的URL变化）
  return (
    url.includes('/geek/recommend') ||
    url.includes('/geek/job') ||
    url.includes('/chat/recommend') ||
    url.includes('/candidate') ||
    url.includes('/resume')
  );
}

/**
 * 检查页面是否已加载
 */
export function isPageReady(): boolean {
  return document.readyState === 'complete' || document.readyState === 'interactive';
}

/**
 * 在Dialog中查找打招呼按钮（稳定的选择器策略）
 * 策略优先级：
 * 1. 通过类名查找（btn-greet相关）
 * 2. 通过文本内容查找（包含"打招呼"）
 * 3. 检查是否已经是"继续沟通"状态（已打过招呼）
 */
export function findGreetButtonInDialog(dialog: Element): {
  button: HTMLButtonElement | null;
  state: 'greet' | 'continue' | 'not-found';
  text: string;
} {
  // 策略1: 查找"打招呼"按钮（多种类名组合）
  const greetButton1 = dialog.querySelector('button.btn-greet') as HTMLButtonElement;
  const greetButton2 = dialog.querySelector('button.btn-sure-v2.btn-greet') as HTMLButtonElement;
  const greetButton3 = dialog.querySelector('button.btn-v2.btn-sure-v2.btn-greet') as HTMLButtonElement;
  const greetButton = greetButton1 || greetButton2 || greetButton3;
  
  if (greetButton && !greetButton.disabled) {
    return {
      button: greetButton,
      state: 'greet',
      text: greetButton.textContent?.trim() || '',
    };
  }
  
  // 策略2: 查找"继续沟通"按钮（已打过招呼）
  const continueButton = dialog.querySelector('button.btn-outline-v2') as HTMLButtonElement;
  if (continueButton && continueButton.textContent?.trim().includes('继续沟通')) {
    return {
      button: continueButton,
      state: 'continue',
      text: continueButton.textContent?.trim() || '',
    };
  }
  
  // 策略3: 通过文本内容查找（兜底策略）
  const allButtons = dialog.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent?.trim() || '';
    if (text.includes('打招呼') && !btn.disabled) {
      return {
        button: btn as HTMLButtonElement,
        state: 'greet',
        text: text,
      };
    }
    if (text.includes('继续沟通')) {
      return {
        button: btn as HTMLButtonElement,
        state: 'continue',
        text: text,
      };
    }
  }
  
  return {
    button: null,
    state: 'not-found',
    text: '',
  };
}

