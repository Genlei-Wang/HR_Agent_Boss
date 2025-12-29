/**
 * API Key配置区域
 */
import { useState } from 'react';
import { useAppStore } from '../store/app-store';
import { useToastContext } from '../contexts/ToastContext';
import { MessageType } from '../../shared/message-types';
import { validateApiKey } from '../../shared/utils';
import { STORAGE_KEYS } from '../../shared/constants';

export function ConfigSection() {
  const { config, updateConfig } = useAppStore();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [testing, setTesting] = useState(false);
  const { success, error } = useToastContext();

  const handleSave = () => {
    if (!apiKey || !validateApiKey(apiKey)) {
      error('API Key格式无效');
      return;
    }
    
    updateConfig({ apiKey });
    // 保存API Key到storage（STORAGE_KEYS.API_KEY的值就是'gemini_api_key'）
    chrome.storage.local.set({ 
      [STORAGE_KEYS.API_KEY]: apiKey
    });
    success('保存成功');
  };

  const handleTest = async () => {
    if (!apiKey || !validateApiKey(apiKey)) {
      error('API Key格式无效');
      return;
    }

    setTesting(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.TEST_API_KEY,
        payload: { apiKey },
      });

      if (response.success) {
        success('API Key验证成功');
        updateConfig({ apiKey });
        // 保存API Key到storage（STORAGE_KEYS.API_KEY的值就是'gemini_api_key'）
        chrome.storage.local.set({ 
          [STORAGE_KEYS.API_KEY]: apiKey
        });
      } else {
        // 显示详细的错误信息
        const errorMsg = response.error || 'API Key无效';
        error(errorMsg);
      }
    } catch (err: any) {
      error(err.message || '测试失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">API Key配置</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="请输入您的Gemini API Key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            保存
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
        </div>
      </div>
    </div>
  );
}

