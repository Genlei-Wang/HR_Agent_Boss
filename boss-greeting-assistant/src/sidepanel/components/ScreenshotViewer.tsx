/**
 * 截图查看器组件
 */
import { useState } from 'react';

interface ScreenshotViewerProps {
  screenshotBase64?: string;
  candidateName: string;
  onClose: () => void;
}

export function ScreenshotViewer({ screenshotBase64, candidateName, onClose }: ScreenshotViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!screenshotBase64) {
    return null;
  }

  // 将Base64转换为Data URL（添加data:image前缀）
  const dataUrl = `data:image/png;base64,${screenshotBase64}`;

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      
      // 创建临时链接并触发下载
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${candidateName}_screenshot_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDownloading(false);
    } catch (error: any) {
      console.error('下载截图失败:', error);
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {candidateName} - Canvas截图
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 text-sm"
            >
              {isDownloading ? '下载中...' : '下载图片'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
            >
              关闭
            </button>
          </div>
        </div>
        
        {/* 图片内容 */}
        <div className="flex-1 overflow-auto p-4">
          <img
            src={dataUrl}
            alt={`${candidateName}的简历截图`}
            className="max-w-full h-auto mx-auto"
            style={{ maxHeight: 'calc(90vh - 120px)' }}
          />
        </div>
      </div>
    </div>
  );
}

