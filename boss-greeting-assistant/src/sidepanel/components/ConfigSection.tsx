/**
 * API Key配置区域
 */
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/app-store';
import { useToastContext } from '../contexts/ToastContext';
import { MessageType } from '../../shared/message-types';
import { validateApiKey } from '../../shared/utils-sw';
import { STORAGE_KEYS } from '../../shared/constants';
import { AIServiceFactory } from '../../shared/ai-service.interface';
import type { AIModelType } from '../../shared/ai-service.interface';

export function ConfigSection() {
  const { config, updateConfig } = useAppStore();
  const [apiKey, setApiKey] = useState(config.aiModel?.apiKey || '');
  const [modelType, setModelType] = useState<AIModelType>(config.aiModel?.type || 'qwen');
  const [testing, setTesting] = useState(false);
  const { success, error } = useToastContext();

  // 当config变化时更新本地状态
  useEffect(() => {
    if (config.aiModel) {
      setApiKey(config.aiModel.apiKey || '');
      setModelType(config.aiModel.type || 'qwen');
    }
  }, [config.aiModel]);

  // 获取支持的模型列表
  const supportedModels = AIServiceFactory.getSupportedModels();
  
  // 获取当前模型的显示名称
  const currentModelDisplayName = supportedModels.find(m => m.type === modelType)?.displayName || '';

  const handleSave = () => {
    if (!apiKey || !validateApiKey(apiKey)) {
      error('API Key格式无效');
      return;
    }
    
    updateConfig({ 
      aiModel: {
        type: modelType,
        apiKey: apiKey,
        model: modelType === 'qwen' ? 'qwen3-vl-plus' : undefined,
      }
    });
    
    // 保存配置到storage
    chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
      const savedConfig = (result[STORAGE_KEYS.CONFIG] || {}) as any;
      chrome.storage.local.set({ 
        [STORAGE_KEYS.CONFIG]: {
          ...savedConfig,
          aiModel: {
            type: modelType,
            apiKey: apiKey,
            model: modelType === 'qwen' ? 'qwen3-vl-plus' : undefined,
          },
        },
        // 兼容旧版本
        [STORAGE_KEYS.API_KEY]: apiKey,
      });
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
        payload: { 
          apiKey,
          modelType: modelType,
          model: modelType === 'qwen' ? 'qwen3-vl-plus' : undefined,
        },
      });

      if (response.success) {
        success('API Key验证成功');
        updateConfig({ 
          aiModel: {
            type: modelType,
            apiKey: apiKey,
            model: modelType === 'qwen' ? 'qwen3-vl-plus' : undefined,
          }
        });
        
        // 保存配置到storage
        chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
          const savedConfig = (result[STORAGE_KEYS.CONFIG] || {}) as any;
          chrome.storage.local.set({ 
            [STORAGE_KEYS.CONFIG]: {
              ...savedConfig,
              aiModel: {
                type: modelType,
                apiKey: apiKey,
                model: modelType === 'qwen' ? 'qwen3-vl-plus' : undefined,
              },
            },
            // 兼容旧版本
            [STORAGE_KEYS.API_KEY]: apiKey,
          });
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

  const handleModelChange = (newModelType: AIModelType) => {
    setModelType(newModelType);
    // 切换模型时，尝试从storage加载该模型的API Key
    chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
      const savedConfig = (result[STORAGE_KEYS.CONFIG] || {}) as any;
      if (savedConfig.aiModel && savedConfig.aiModel.type === newModelType) {
        setApiKey(savedConfig.aiModel.apiKey || '');
      } else {
        // 如果没有保存的API Key，清空输入框
        setApiKey('');
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">AI模型配置</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择AI模型
          </label>
          <select
            value={modelType}
            onChange={e => handleModelChange(e.target.value as AIModelType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {supportedModels.map(model => (
              <option key={model.type} value={model.type}>
                {model.displayName}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {currentModelDisplayName} API Key
            {(!apiKey || !validateApiKey(apiKey)) && (
              <span className="text-red-600 ml-2 text-xs">* 必填</span>
            )}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={`请输入您的${currentModelDisplayName} API Key`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              apiKey && !validateApiKey(apiKey)
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {apiKey && !validateApiKey(apiKey) && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ API Key格式无效，长度应大于20个字符
            </p>
          )}
          {!apiKey && (
            <p className="text-xs text-gray-500 mt-1">
              请先配置API Key才能使用AI功能
            </p>
          )}
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

