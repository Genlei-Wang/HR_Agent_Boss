/**
 * 日志区域
 */
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/app-store';
import { useToastContext } from '../contexts/ToastContext';
import { exportLogsToTxt, downloadTextFile, formatTimestamp } from '../../shared/utils';
import { ScreenshotViewer } from './ScreenshotViewer';

export function LogSection() {
  const { 
    logs, 
    stats, 
    sessionLogs, 
    currentSessionId, 
    setCurrentSession,
    getSessionById 
  } = useAppStore();
  const { success, error } = useToastContext();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(currentSessionId);
  const [viewingScreenshot, setViewingScreenshot] = useState<{ base64: string; name: string } | null>(null);

  // 同步selectedSessionId和currentSessionId
  useEffect(() => {
    setSelectedSessionId(currentSessionId);
  }, [currentSessionId]);

  // 当选择改变时，切换显示的session
  const handleSessionChange = (sessionId: string) => {
    if (sessionId === '') {
      // 选择"当前运行"，显示当前运行的日志
      setSelectedSessionId(null);
      setCurrentSession(null);
    } else {
      setSelectedSessionId(sessionId);
      setCurrentSession(sessionId);
    }
  };

  // 获取当前显示的session
  const displaySession = selectedSessionId ? getSessionById(selectedSessionId) : null;
  // 如果选中了历史session，显示历史日志；否则显示当前运行的日志
  const displayLogs = displaySession ? displaySession.logs : logs;
  const displayStats = displaySession ? displaySession.stats : stats;

  const handleExportCurrent = () => {
    if (displayLogs.length === 0) {
      error('当前运行记录暂无日志可导出');
      return;
    }
    
    try {
      const sessionInfo = displaySession 
        ? `运行记录: ${formatTimestamp(displaySession.startTime)} - ${displaySession.endTime ? formatTimestamp(displaySession.endTime) : '进行中'}\n状态: ${displaySession.status}\n`
        : '';
      
      const content = `${sessionInfo}${exportLogsToTxt(displayLogs, displayStats)}`;
      const filename = `boss-greeting-log-${selectedSessionId || 'current'}-${Date.now()}.txt`;
      downloadTextFile(content, filename);
      success('导出成功');
    } catch (err: any) {
      error(`导出失败: ${err.message || '未知错误'}`);
    }
  };

  const handleExportAll = () => {
    if (sessionLogs.length === 0) {
      error('暂无历史运行记录可导出');
      return;
    }
    
    try {
      let content = `Boss招聘智能助手 - 所有运行记录\n导出时间: ${formatTimestamp(Date.now())}\n\n`;
      content += '='.repeat(50) + '\n\n';
      
      sessionLogs.forEach((session, index) => {
        content += `运行记录 #${sessionLogs.length - index}\n`;
        content += `开始时间: ${formatTimestamp(session.startTime)}\n`;
        content += `结束时间: ${session.endTime ? formatTimestamp(session.endTime) : '未完成'}\n`;
        content += `状态: ${session.status}\n`;
        content += `统计: 处理${session.stats.processed}人, 匹配${session.stats.matched}人, 打招呼${session.stats.greeted}人\n`;
        content += '\n';
        content += exportLogsToTxt(session.logs, session.stats);
        content += '\n' + '='.repeat(50) + '\n\n';
      });
      
      const filename = `boss-greeting-all-logs-${Date.now()}.txt`;
      downloadTextFile(content, filename);
      success('导出成功');
    } catch (err: any) {
      error(`导出失败: ${err.message || '未知错误'}`);
    }
  };

  const getActionBadge = (action: string) => {
    const config = {
      greeted: { text: '已打招呼', className: 'bg-green-100 text-green-700' },
      skipped: { text: '跳过', className: 'bg-gray-100 text-gray-700' },
      error: { text: '错误', className: 'bg-red-100 text-red-700' },
    };
    
    const badge = config[action as keyof typeof config] || config.error;
    
    return (
      <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getMatchBadge = (match: boolean) => {
    return match ? (
      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
        ✓ 匹配
      </span>
    ) : (
      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
        ✗ 不匹配
      </span>
    );
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      idle: '未开始',
      running: '运行中',
      paused: '已暂停',
      completed: '已完成',
      error: '错误',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      idle: 'text-gray-500',
      running: 'text-blue-500',
      paused: 'text-yellow-500',
      completed: 'text-green-500',
      error: 'text-red-500',
    };
    return map[status] || 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">运行日志</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCurrent}
            disabled={displayLogs.length === 0}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition disabled:opacity-50"
          >
            导出当前
          </button>
          <button
            onClick={handleExportAll}
            disabled={sessionLogs.length === 0}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            导出全部
          </button>
        </div>
      </div>
      
      {/* 历史记录选择器 */}
      {sessionLogs.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            历史运行记录
          </label>
          <select
            value={selectedSessionId || ''}
            onChange={(e) => handleSessionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">当前运行</option>
            {sessionLogs.map((session) => (
              <option key={session.sessionId} value={session.sessionId}>
                {formatTimestamp(session.startTime)} - {getStatusText(session.status)} ({session.stats.processed}人)
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* 当前选中运行的信息 */}
      {displaySession && (
        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-700">开始时间: </span>
              <span className="text-gray-600">{formatTimestamp(displaySession.startTime)}</span>
            </div>
            {displaySession.endTime && (
              <div>
                <span className="font-medium text-gray-700">结束时间: </span>
                <span className="text-gray-600">{formatTimestamp(displaySession.endTime)}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">状态: </span>
              <span className={getStatusColor(displaySession.status)}>{getStatusText(displaySession.status)}</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            统计: 处理{displayStats.processed}人 | 匹配{displayStats.matched}人 | 打招呼{displayStats.greeted}人 | 跳过{displayStats.skipped}人
          </div>
        </div>
      )}
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayLogs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            暂无日志
          </div>
        ) : (
          displayLogs.map(log => (
            <div key={log.id} className="border border-gray-200 rounded p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800">{log.candidateName}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(log.timestamp).split(' ')[1]}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                {getMatchBadge(log.matchResult)}
                {getActionBadge(log.action)}
                <span className="text-xs text-gray-500">
                  置信度: {(log.matchConfidence * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="text-xs text-gray-600 mb-1">
                {log.candidateInfo.age && <span>{log.candidateInfo.age} · </span>}
                {log.candidateInfo.education && <span>{log.candidateInfo.education} · </span>}
                {log.candidateInfo.company && <span>{log.candidateInfo.company}</span>}
              </div>
              
              <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                {log.matchReason}
              </div>
              
              {log.errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                  错误: {log.errorMessage}
                </div>
              )}
              
              {/* 截图查看按钮 */}
              {log.screenshotBase64 && (
                <div className="mt-2">
                  <button
                    onClick={() => setViewingScreenshot({ base64: log.screenshotBase64!, name: log.candidateName })}
                    className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                  >
                    📷 查看截图
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* 截图查看器 */}
      {viewingScreenshot && (
        <ScreenshotViewer
          screenshotBase64={viewingScreenshot.base64}
          candidateName={viewingScreenshot.name}
          onClose={() => setViewingScreenshot(null)}
        />
      )}
    </div>
  );
}

