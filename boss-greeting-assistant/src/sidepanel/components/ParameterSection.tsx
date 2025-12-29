/**
 * 参数配置区域
 */
import { useAppStore } from '../store/app-store';
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../../shared/constants';

interface Props {
  disabled: boolean;
}

export function ParameterSection({ disabled }: Props) {
  const { config, updateConfig } = useAppStore();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">参数配置</h2>
      
      <div className="space-y-4">
        {/* 候选人数量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            循环候选人数量
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={config.candidateCount ?? ''}
            onChange={e => {
              const value = e.target.value;
              const numValue = value === '' ? undefined : (value ? parseInt(value) : undefined);
              updateConfig({ candidateCount: numValue });
              // 保存配置
              chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                chrome.storage.local.set({
                  [STORAGE_KEYS.CONFIG]: { ...savedConfig, candidateCount: numValue }
                });
              });
            }}
            onBlur={e => {
              // 失焦时如果没有值，设置为默认值
              if (e.target.value === '') {
                const defaultValue = 50;
                updateConfig({ candidateCount: defaultValue });
                chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                  const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                  chrome.storage.local.set({
                    [STORAGE_KEYS.CONFIG]: { ...savedConfig, candidateCount: defaultValue }
                  });
                });
              }
            }}
            placeholder="请输入"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ 建议不超过100人/天，降低封号风险
          </p>
        </div>
        
        {/* JD描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            职位描述JD
          </label>
          <textarea
            value={config.jobDescription}
            onChange={e => {
              updateConfig({ jobDescription: e.target.value });
              // 保存配置
              chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                chrome.storage.local.set({
                  [STORAGE_KEYS.CONFIG]: { ...savedConfig, jobDescription: e.target.value }
                });
              });
            }}
            disabled={disabled}
            rows={6}
            placeholder="请输入岗位要求、核心技能等&#10;例如：&#10;- 3年以上前端开发经验&#10;- 熟练掌握React/Vue&#10;- 有大型项目经验"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            字数: {config.jobDescription.length} 
            {config.jobDescription.length < 20 && config.jobDescription.length > 0 && (
              <span className="text-yellow-600 ml-2">⚠️ 建议至少20字以提高准确度</span>
            )}
          </p>
        </div>
        
        {/* 操作间隔 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            操作间隔（随机）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="10"
              value={config.delayRange?.min ?? ''}
              onChange={e => {
                const value = e.target.value;
                const numValue = value === '' ? undefined : (value ? parseInt(value) : undefined);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParameterSection.tsx:104',message:'修改delayRange.min前',data:{currentDelayRange:config.delayRange,newMinValue:numValue,hasDelayRange:!!config.delayRange},timestamp:Date.now(),sessionId:'debug-session',runId:'config-debug',hypothesisId:'DELAY_RANGE_MERGE'})}).catch(()=>{});
                // #endregion
                // 确保delayRange存在，避免丢失另一个值
                const currentDelayRange = config.delayRange || {
                  min: DEFAULT_CONFIG.DELAY_MIN,
                  max: DEFAULT_CONFIG.DELAY_MAX,
                };
                const newDelayRange = {
                  ...currentDelayRange,
                  min: numValue ?? DEFAULT_CONFIG.DELAY_MIN
                };
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParameterSection.tsx:115',message:'修改delayRange.min后',data:{newDelayRange,hasMax:!!newDelayRange.max},timestamp:Date.now(),sessionId:'debug-session',runId:'config-debug',hypothesisId:'DELAY_RANGE_MERGE'})}).catch(()=>{});
                // #endregion
                updateConfig({ delayRange: newDelayRange });
                // 保存配置
                chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                  const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                  chrome.storage.local.set({
                    [STORAGE_KEYS.CONFIG]: { ...savedConfig, delayRange: newDelayRange }
                  });
                });
              }}
              onBlur={e => {
                if (e.target.value === '') {
                  // 确保delayRange存在，避免丢失另一个值
                  const currentDelayRange = config.delayRange || {
                    min: DEFAULT_CONFIG.DELAY_MIN,
                    max: DEFAULT_CONFIG.DELAY_MAX,
                  };
                  const newDelayRange = { ...currentDelayRange, min: DEFAULT_CONFIG.DELAY_MIN };
                  updateConfig({ delayRange: newDelayRange });
                  chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                    const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                    chrome.storage.local.set({
                      [STORAGE_KEYS.CONFIG]: { ...savedConfig, delayRange: newDelayRange }
                    });
                  });
                }
              }}
              placeholder="请输入"
              disabled={disabled}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="1"
              max="10"
              value={config.delayRange?.max ?? ''}
              onChange={e => {
                const value = e.target.value;
                const numValue = value === '' ? undefined : (value ? parseInt(value) : undefined);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParameterSection.tsx:142',message:'修改delayRange.max前',data:{currentDelayRange:config.delayRange,newMaxValue:numValue,hasDelayRange:!!config.delayRange},timestamp:Date.now(),sessionId:'debug-session',runId:'config-debug',hypothesisId:'DELAY_RANGE_MERGE'})}).catch(()=>{});
                // #endregion
                // 确保delayRange存在，避免丢失另一个值
                const currentDelayRange = config.delayRange || {
                  min: DEFAULT_CONFIG.DELAY_MIN,
                  max: DEFAULT_CONFIG.DELAY_MAX,
                };
                const newDelayRange = {
                  ...currentDelayRange,
                  max: numValue ?? DEFAULT_CONFIG.DELAY_MAX
                };
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParameterSection.tsx:153',message:'修改delayRange.max后',data:{newDelayRange,hasMin:!!newDelayRange.min},timestamp:Date.now(),sessionId:'debug-session',runId:'config-debug',hypothesisId:'DELAY_RANGE_MERGE'})}).catch(()=>{});
                // #endregion
                updateConfig({ delayRange: newDelayRange });
                // 保存配置
                chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                  const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                  chrome.storage.local.set({
                    [STORAGE_KEYS.CONFIG]: { ...savedConfig, delayRange: newDelayRange }
                  });
                });
              }}
              onBlur={e => {
                if (e.target.value === '') {
                  // 确保delayRange存在，避免丢失另一个值
                  const currentDelayRange = config.delayRange || {
                    min: DEFAULT_CONFIG.DELAY_MIN,
                    max: DEFAULT_CONFIG.DELAY_MAX,
                  };
                  const newDelayRange = { ...currentDelayRange, max: DEFAULT_CONFIG.DELAY_MAX };
                  updateConfig({ delayRange: newDelayRange });
                  chrome.storage.local.get([STORAGE_KEYS.CONFIG]).then(result => {
                    const savedConfig = result[STORAGE_KEYS.CONFIG] || {};
                    chrome.storage.local.set({
                      [STORAGE_KEYS.CONFIG]: { ...savedConfig, delayRange: newDelayRange }
                    });
                  });
                }
              }}
              placeholder="请输入"
              disabled={disabled}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <span className="text-gray-500">秒</span>
          </div>
        </div>
      </div>
    </div>
  );
}

