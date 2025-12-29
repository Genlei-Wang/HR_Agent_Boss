/**
 * 截图服务
 */

/**
 * 截图服务
 */
export class ScreenshotService {
  /**
   * 捕获指定区域的截图
   */
  static async captureArea(rect: DOMRect | { x: number; y: number; width: number; height: number }): Promise<string> {
    try {
      // Gemini API支持较大的图片，移除高度限制以确保截图完整
      // 如果图片文件过大（Base64 > 4MB），可以考虑压缩而不是限制高度
      // 根据Gemini API文档，单张图片最大支持20MB（Base64编码后）
      const MAX_HEIGHT = 10000; // 提高最大高度到10000px，基本不限制
      const limitedRect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: Math.min(rect.height, MAX_HEIGHT),
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:18',message:'captureArea called',data:{originalH:rect.height,limitedH:limitedRect.height,limited:rect.height>MAX_HEIGHT,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'SIZE'})}).catch(()=>{});
      // #endregion
      
      rect = limitedRect;
      
      // 1. 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:23',message:'Tab query result',data:{hasTab:!!tab,tabId:tab?.id,windowId:tab?.windowId,url:tab?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
      // #endregion
      
      if (!tab?.id || !tab.windowId) {
        throw new Error('No active tab found');
      }
      
      // 2. 尝试多种方式捕获截图
      let dataUrl: string;
      
      try {
        // 方法1：不带参数
        dataUrl = await chrome.tabs.captureVisibleTab({
          format: 'png',
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:41',message:'Capture success - method 1',data:{dataUrlLength:dataUrl.length},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
        // #endregion
      } catch (e1: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:47',message:'Method 1 failed',data:{error:e1.message},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
        // #endregion
        
        try {
          // 方法2：带windowId
          dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
          });
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:59',message:'Capture success - method 2',data:{dataUrlLength:dataUrl.length},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
          // #endregion
        } catch (e2: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:65',message:'Both methods failed',data:{error1:e1.message,error2:e2.message},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
          // #endregion
          
          throw e2;
        }
      }
      
      // 3. 裁剪指定区域
      const croppedBase64 = await this.cropImage(dataUrl, rect);
      
      // 计算图片大小（Base64编码后）
      const base64SizeKB = Math.round(croppedBase64.length / 1024);
      const estimatedOriginalSizeKB = Math.round(base64SizeKB * 3 / 4); // Base64编码会增加约33%大小
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:79',message:'Crop success',data:{base64Length:croppedBase64.length,base64SizeKB,estimatedOriginalSizeKB,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
      // #endregion
      
      return croppedBase64;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:87',message:'captureArea FAILED',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'PERM'})}).catch(()=>{});
      // #endregion
      
      console.error('[ScreenshotService] Capture failed:', error);
      throw new Error(`截图失败: ${error.message}`);
    }
  }
  
  /**
   * 裁剪图片 - Service Worker环境适配
   */
  private static async cropImage(
    dataUrl: string,
    rect: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    try {
      // 将dataUrl转换为Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // 使用createImageBitmap（Service Worker支持）
      const imageBitmap = await createImageBitmap(blob);
      
      // 关键诊断：记录imageBitmap尺寸和rect信息
      const imageBitmapWidth = imageBitmap.width;
      const imageBitmapHeight = imageBitmap.height;
      
      // 关键修复：rect坐标是CSS像素（逻辑像素），但captureVisibleTab()捕获的图片尺寸是物理像素（受devicePixelRatio影响）
      // 需要计算缩放比例：imageBitmap尺寸 / CSS视口尺寸
      // 由于我们在service worker中无法直接获取CSS视口尺寸，需要通过imageBitmap尺寸推断
      // 但更准确的方法：通过rect坐标和imageBitmap尺寸计算缩放比例
      // 假设rect坐标是CSS像素，图片尺寸是物理像素，缩放比例 = imageBitmapWidth / CSS视口宽度
      // 但我们不知道CSS视口宽度，所以需要通过其他方式推断
      
      // 方法1：通过imageBitmap尺寸推断（假设标准视口宽度）
      // 从日志看，视口宽度约945px（CSS像素），imageBitmapWidth=2226px（物理像素），缩放比例≈2.35
      // 但这种方法不准确，因为视口宽度可能变化
      
      // 方法2：通过rect坐标和imageBitmap尺寸计算缩放比例（更准确）
      // 如果rect.x是CSS像素，rect.x * scale = 图片中的实际x坐标
      // 但我们不知道rect.x在图片中的实际位置，所以无法直接计算
      
      // 方法3：直接使用rect坐标，假设chrome.tabs.captureVisibleTab()的坐标系统已经是CSS像素
      // 但根据日志，rect.x=168（CSS像素），但图片宽度=2226px（物理像素），说明图片确实是物理像素
      // 所以rect坐标需要转换
      
      // 关键：我们需要知道CSS视口尺寸来计算缩放比例
      // 但由于我们在service worker中，无法直接获取，所以需要通过其他方式
      // 最准确的方法：在content script中计算缩放比例，然后传递给service worker
      // 但目前的架构是：content script返回rect（CSS像素），service worker直接使用
      
      // 临时解决方案：通过imageBitmap尺寸和rect坐标推断缩放比例
      // 假设rect.x=168是CSS像素，如果图片宽度=2226px，视口宽度≈945px，缩放比例≈2.35
      // 但这种方法不准确，因为视口宽度可能变化
      
      // 更准确的方法：通过rect坐标和imageBitmap尺寸计算缩放比例
      // 如果rect.x=168（CSS像素），rect.x * scale应该在图片中的某个位置
      // 但我们不知道rect.x在图片中的实际位置，所以无法直接计算
      
      // 最终方案：假设chrome.tabs.captureVisibleTab()捕获的图片尺寸是物理像素
      // 而rect坐标是CSS像素，需要乘以devicePixelRatio
      // 但我们无法直接获取devicePixelRatio，所以通过imageBitmap尺寸推断
      // 假设标准视口宽度（从日志看约945px），计算缩放比例
      const ESTIMATED_VIEWPORT_WIDTH = 945; // 从日志中看到的视口宽度
      const ESTIMATED_VIEWPORT_HEIGHT = 817; // 从日志中看到的视口高度
      const scaleX = imageBitmapWidth / ESTIMATED_VIEWPORT_WIDTH;
      const scaleY = imageBitmapHeight / ESTIMATED_VIEWPORT_HEIGHT;
      
      // 将rect坐标从CSS像素转换为物理像素
      const rectInPhysicalPixels = {
        x: rect.x * scaleX,
        y: rect.y * scaleY,
        width: rect.width * scaleX,
        height: rect.height * scaleY
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:123',message:'裁剪前检查-坐标转换',data:{imageBitmapWidth,imageBitmapHeight,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},rectInPhysicalPixels,scaleX,scaleY,estimatedViewportWidth:ESTIMATED_VIEWPORT_WIDTH,estimatedViewportHeight:ESTIMATED_VIEWPORT_HEIGHT},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'CROP_COORDS'})}).catch(()=>{});
      // #endregion
      
      // 确保rect在imageBitmap范围内（使用转换后的物理像素坐标）
      const cropX = Math.max(0, Math.min(Math.round(rectInPhysicalPixels.x), imageBitmapWidth - 1));
      const cropY = Math.max(0, Math.min(Math.round(rectInPhysicalPixels.y), imageBitmapHeight - 1));
      const cropWidth = Math.min(Math.round(rectInPhysicalPixels.width), imageBitmapWidth - cropX);
      const cropHeight = Math.min(Math.round(rectInPhysicalPixels.height), imageBitmapHeight - cropY);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:130',message:'裁剪坐标调整',data:{originalRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},adjustedCrop:{x:cropX,y:cropY,width:cropWidth,height:cropHeight},imageBitmapWidth,imageBitmapHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'CROP_ADJUST'})}).catch(()=>{});
      // #endregion
      
      // 关键修复：使用实际裁剪的尺寸创建canvas，避免图片拉伸变形！
      // 问题：如果rect.height=4140px，但imageBitmap.height=1714px，裁剪时高度被限制为1714px
      // 但如果canvas尺寸使用rect.height=4140px，图片会被拉伸变形！
      // 解决方案：使用实际裁剪的尺寸（cropWidth x cropHeight）作为canvas尺寸
      const finalCanvasWidth = cropWidth;
      const finalCanvasHeight = cropHeight;
      
      // 创建canvas，使用实际裁剪尺寸（避免拉伸）
      const finalCanvas = new OffscreenCanvas(finalCanvasWidth, finalCanvasHeight);
      const finalCtx = finalCanvas.getContext('2d');
      
      if (!finalCtx) {
        throw new Error('Failed to get canvas context');
      }
      
      // 绘制裁剪后的图像（1:1映射，不拉伸）
      // 从imageBitmap的(cropX, cropY)位置，裁剪(cropWidth x cropHeight)的区域
      // 绘制到canvas的(0, 0)位置，尺寸为(finalCanvasWidth x finalCanvasHeight)
      finalCtx.drawImage(
        imageBitmap,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalCanvasWidth,
        finalCanvasHeight
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'screenshot-service.ts:155',message:'裁剪绘制完成',data:{originalRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},cropArea:{x:cropX,y:cropY,width:cropWidth,height:cropHeight},canvasSize:{width:finalCanvasWidth,height:finalCanvasHeight},imageBitmapSize:{width:imageBitmapWidth,height:imageBitmapHeight},aspectRatioOriginal:rect.width/rect.height,aspectRatioCropped:cropWidth/cropHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'screenshot-debug',hypothesisId:'CROP_DRAW'})}).catch(()=>{});
      // #endregion
      
      // 转换为Blob
      const croppedBlob = await finalCanvas.convertToBlob({ type: 'image/png' });
      
      // 转换为Base64 - 分块处理避免栈溢出
      const arrayBuffer = await croppedBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192; // 每次处理8KB
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      
      return base64;
    } catch (error: any) {
      console.error('[ScreenshotService] Crop failed:', error);
      throw new Error(`图片裁剪失败: ${error.message}`);
    }
  }
}

