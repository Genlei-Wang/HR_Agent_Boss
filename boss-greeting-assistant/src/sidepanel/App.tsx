/**
 * 主应用组件
 * 
 * Copyright (c) 2025 Genlei-Wang. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */
import { useEffect } from 'react';
import { ConfigSection } from './components/ConfigSection';
import { ParameterSection } from './components/ParameterSection';
import { ControlSection } from './components/ControlSection';
import { StatusSection } from './components/StatusSection';
import { LogSection } from './components/LogSection';
import { ToastContainer } from './components/Toast';
import { ToastProvider, useToastContext } from './contexts/ToastContext';
import { useAppStore } from './store/app-store';
import { MessageType } from '../shared/message-types';
import type { Message } from '../shared/message-types';
import { STORAGE_KEYS } from '../shared/constants';

function AppContent() {
  const { 
    status, 
    setStatus, 
    updateStats, 
    addLog, 
    updateConfig, 
    loadSessionLogs,
    createSession,
    saveSessionLogs 
  } = useAppStore();
  const { toasts, removeToast, error, warning } = useToastContext();

  useEffect(() => {
    // 加载保存的配置
    chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.CONFIG]).then(result => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:35',message:'加载配置前',data:{hasApiKey:!!result[STORAGE_KEYS.API_KEY],hasConfig:!!result[STORAGE_KEYS.CONFIG],configKeys:result[STORAGE_KEYS.CONFIG]?Object.keys(result[STORAGE_KEYS.CONFIG]):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'config-debug',hypothesisId:'CONFIG_LOAD'})}).catch(()=>{});
      // #endregion
      // 加载API Key（兼容旧的gemini_api_key）
      const apiKey = result[STORAGE_KEYS.API_KEY];
      if (apiKey) {
        updateConfig({ apiKey });
      }
      // 加载其他配置
      if (result[STORAGE_KEYS.CONFIG]) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:44',message:'加载配置',data:{savedConfig:result[STORAGE_KEYS.CONFIG]},timestamp:Date.now(),sessionId:'debug-session',runId:'config-debug',hypothesisId:'CONFIG_LOAD'})}).catch(()=>{});
        // #endregion
        updateConfig(result[STORAGE_KEYS.CONFIG]);
      }
    });
    
    // 加载历史运行记录
    loadSessionLogs();

    // 监听来自Background/Content Script的消息
    const messageListener = (message: Message) => {
      switch (message.type) {
        case MessageType.LOG_UPDATE:
          if (message.payload?.log) {
            addLog(message.payload.log);
          }
          break;
          
        case MessageType.STATUS_UPDATE:
          if (message.payload?.status) {
            setStatus(message.payload.status);
          }
          break;
          
        case MessageType.STATS_UPDATE:
          if (message.payload?.stats) {
            updateStats(message.payload.stats);
          }
          break;
          
        case MessageType.AUTOMATION_COMPLETE:
          setStatus('completed');
          break;
          
        case MessageType.CAPTCHA_DETECTED:
          setStatus('paused');
          warning('检测到验证码，已暂停运行，请手动处理后点击继续');
          break;
          
        case MessageType.ERROR_OCCURRED:
          setStatus('error');
          if (message.payload?.message) {
            error(`错误: ${message.payload.message}`);
          }
          break;
          
        case MessageType.CREATE_SESSION:
          createSession();
          break;
          
        case MessageType.SAVE_SESSION:
          saveSessionLogs();
          break;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [setStatus, updateStats, addLog, updateConfig, error, warning, loadSessionLogs, createSession, saveSessionLogs]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <main className="space-y-4">
        <ConfigSection />
        <ParameterSection disabled={status === 'running'} />
        <ControlSection />
        <StatusSection />
        <LogSection />
      </main>
      
      <footer className="mt-6 text-center text-xs text-gray-400">
        <p>Boss招聘智能助手 v1.0.0</p>
        <p className="mt-1">⚠️ 请合理使用，避免频繁操作</p>
      </footer>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

