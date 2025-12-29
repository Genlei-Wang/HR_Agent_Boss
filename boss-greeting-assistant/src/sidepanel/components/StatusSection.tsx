/**
 * 运行状态区域
 */
import { useAppStore } from '../store/app-store';

export function StatusSection() {
  const { status, stats, config } = useAppStore();

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return '待命中';
      case 'running':
        return `运行中 (${stats.processed}/${config.candidateCount ?? 50})`;
      case 'paused':
        return '已暂停';
      case 'completed':
        return '已完成';
      case 'error':
        return '异常中断';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'text-gray-600';
      case 'running':
        return 'text-blue-600';
      case 'paused':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">运行状态</h2>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">状态:</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {status === 'running' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(stats.processed / (config.candidateCount ?? 50)) * 100}%`,
              }}
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">匹配</div>
            <div className="text-lg font-semibold text-green-600">{stats.matched}人</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">不匹配</div>
            <div className="text-lg font-semibold text-gray-600">{stats.skipped}人</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">已打招呼</div>
            <div className="text-lg font-semibold text-blue-600">{stats.greeted}人</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">总处理</div>
            <div className="text-lg font-semibold text-gray-800">{stats.processed}人</div>
          </div>
        </div>
      </div>
    </div>
  );
}

