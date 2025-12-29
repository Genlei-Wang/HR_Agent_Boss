/**
 * Content Script入口文件
 */
import { AutomationController } from './automation-controller';
import { MessageType } from '../shared/message-types';
import type { Message } from '../shared/message-types';

// 初始化自动化控制器
const controller = new AutomationController();

// 监听来自Side Panel的消息
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('[Content Script] Received message:', message.type);
  
  switch (message.type) {
    case 'PING':
      // 响应ping消息，表示Content Script已加载
      sendResponse({ success: true, message: 'Content Script is ready' });
      return true;
      
    case MessageType.START_AUTOMATION:
      // 开始自动化
      if (message.payload) {
        controller.start(message.payload).catch(error => {
          console.error('[Content Script] Start automation failed:', error);
          sendResponse({ success: false, error: error.message });
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Missing config payload' });
      }
      break;
      
    case MessageType.STOP_AUTOMATION:
      // 停止自动化
      controller.stop();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  // 返回true表示将异步发送响应
  return true;
});

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Content Script] DOM loaded');
  });
} else {
  console.log('[Content Script] Initialized');
}

console.log('[Content Script] Boss Greeting Assistant content script loaded');

