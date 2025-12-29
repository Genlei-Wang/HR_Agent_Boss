/**
 * 控制按钮区域
 */
import { useAppStore } from '../store/app-store';
import { useToastContext } from '../contexts/ToastContext';
import { MessageType } from '../../shared/message-types';
import { validateJobDescription } from '../../shared/utils';
import { ERROR_MESSAGES } from '../../shared/constants';

export function ControlSection() {
  const { status, config, setStatus, createSession } = useAppStore();
  const { success, error, warning } = useToastContext();

  const handleStart = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ControlSection.tsx:14',message:'启动前配置检查',data:{hasApiKey:!!config.apiKey,hasJobDescription:!!config.jobDescription,candidateCount:config.candidateCount,delayRange:config.delayRange},timestamp:Date.now(),sessionId:'debug-session',runId:'start-debug',hypothesisId:'START_VALIDATION'})}).catch(()=>{});
    // #endregion
    // 验证配置
    if (!config.apiKey) {
      error(ERROR_MESSAGES.NO_API_KEY || '请先配置API Key');
      return;
    }

    const jdValidation = validateJobDescription(config.jobDescription);
    if (!jdValidation.valid) {
      error(jdValidation.message || '职位描述无效');
      return;
    }

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        error('无法获取当前标签页');
        return;
      }

      // 检查是否在Boss直聘页面
      if (!tab.url || !tab.url.includes('zhipin.com')) {
        error('请先打开Boss直聘候选人列表页面\n访问: https://www.zhipin.com/web/geek/recommend');
        return;
      }

      // 确保Content Script已注入（通过ping检查）
      try {
        // 先尝试发送ping消息检查Content Script是否存在
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        console.log('[ControlSection] Content Script is ready');
      } catch (pingError: any) {
        // Content Script可能未加载，提示用户刷新页面
        console.error('[ControlSection] Content Script not found:', pingError);
        warning('Content Script未加载\n请刷新Boss直聘页面（F5）后重试');
        return;
      }

      // 发送开始消息到Content Script（带重试机制）
      let response: any = null;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await chrome.tabs.sendMessage(tab.id, {
            type: MessageType.START_AUTOMATION,
            payload: config,
          });
          break;
        } catch (sendError: any) {
          retries--;
          if (retries === 0) {
            throw sendError;
          }
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (response?.success) {
        // 创建新的session
        createSession();
        setStatus('running');
        // 移除toast提示，只有成功、停止、失败才提示
      } else {
        error(`启动失败: ${response?.error || '未知错误'}`);
      }
    } catch (err: any) {
      console.error('[ControlSection] Start failed:', err);
      const errorMsg = err.message || '未知错误';
      if (errorMsg.includes('Receiving end does not exist')) {
        warning('Content Script未正确加载\n请刷新Boss直聘页面（F5）后重试');
      } else {
        error(`启动失败: ${errorMsg}`);
      }
    }
  };

  const handleStop = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: MessageType.STOP_AUTOMATION,
        });
      }
      setStatus('idle');
      success('已停止');
    } catch (err: any) {
      console.error('停止失败:', err);
      error('停止失败');
    }
  };

  const getButtonConfig = () => {
    switch (status) {
      case 'idle':
      case 'completed':
      case 'error':
      case 'paused':
        return {
          text: '开始打招呼',
          onClick: handleStart,
          className: 'bg-blue-500 hover:bg-blue-600',
          disabled: false,
        };
      case 'running':
        return {
          text: '停止',
          onClick: handleStop,
          className: 'bg-red-500 hover:bg-red-600',
          disabled: false,
        };
      default:
        return {
          text: '开始打招呼',
          onClick: handleStart,
          className: 'bg-blue-500 hover:bg-blue-600',
          disabled: false,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <button
        onClick={buttonConfig.onClick}
        disabled={buttonConfig.disabled}
        className={`w-full py-3 text-white font-semibold rounded-md transition ${buttonConfig.className} disabled:opacity-50`}
      >
        {buttonConfig.text}
      </button>
    </div>
  );
}

