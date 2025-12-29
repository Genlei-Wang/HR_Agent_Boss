/**
 * 文件保存服务
 * 用于将截图和缩略图保存到本地
 */

/**
 * 保存截图到本地
 */
export async function saveScreenshotToFile(
  base64Image: string,
  candidateName: string,
  candidateIndex: number,
  sessionDir: string
): Promise<void> {
  try {
    // 将Base64转换为Blob
    const base64Data = base64Image;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // 创建Blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    // 生成文件名：screenshots/会话目录/候选人索引_候选人姓名_时间戳.png
    const timestamp = Date.now();
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const filename = `screenshots/${sessionDir}/${candidateIndex}_${sanitizedName}_${timestamp}.png`;
    
    // 使用chrome.downloads API下载文件
    await chrome.downloads.download({
      url: blobUrl,
      filename: filename,
      saveAs: false, // 自动保存，不弹出对话框
    });
    
    // 清理Blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'file-saver.ts:45',message:'截图已保存到本地',data:{filename,candidateName,candidateIndex,sessionDir,base64Length:base64Image.length},timestamp:Date.now(),sessionId:sessionDir,runId:'file-save',hypothesisId:'FILE_SAVE'})}).catch(()=>{});
    // #endregion
    console.log(`[FileSaver] 截图已保存: ${filename}`);
  } catch (error: any) {
    console.error('[FileSaver] 保存截图失败:', error);
    throw error;
  }
}

/**
 * 创建缩略图并保存
 */
export async function saveThumbnailToFile(
  base64Image: string,
  candidateName: string,
  candidateIndex: number,
  sessionDir: string,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<void> {
  try {
    // 将Base64转换为ImageBitmap
    const base64Data = base64Image;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // 使用createImageBitmap加载图片
    const imageBitmap = await createImageBitmap(blob);
    
    // 计算缩略图尺寸
    const { width, height } = imageBitmap;
    let thumbWidth = width;
    let thumbHeight = height;
    
    if (width > height) {
      if (width > maxWidth) {
        thumbWidth = maxWidth;
        thumbHeight = (height * maxWidth) / width;
      }
    } else {
      if (height > maxHeight) {
        thumbHeight = maxHeight;
        thumbWidth = (width * maxHeight) / height;
      }
    }
    
    // 创建OffscreenCanvas生成缩略图
    const canvas = new OffscreenCanvas(thumbWidth, thumbHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // 绘制缩略图
    ctx.drawImage(imageBitmap, 0, 0, thumbWidth, thumbHeight);
    
    // 转换为Blob
    const thumbBlob = await canvas.convertToBlob({ type: 'image/png', quality: 0.8 });
    
    // 创建Blob URL
    const blobUrl = URL.createObjectURL(thumbBlob);
    
    // 生成文件名：screenshots/会话目录/thumbnails/候选人索引_候选人姓名_时间戳_thumb.png
    const timestamp = Date.now();
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const filename = `screenshots/${sessionDir}/thumbnails/${candidateIndex}_${sanitizedName}_${timestamp}_thumb.png`;
    
    // 使用chrome.downloads API下载文件
    await chrome.downloads.download({
      url: blobUrl,
      filename: filename,
      saveAs: false, // 自动保存，不弹出对话框
    });
    
    // 清理资源
    imageBitmap.close();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e1fd0d8-f02d-40e1-8fde-af751f6bdd3f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'file-saver.ts:95',message:'缩略图已保存到本地',data:{filename,candidateName,candidateIndex,sessionDir,thumbWidth,thumbHeight},timestamp:Date.now(),sessionId:sessionDir,runId:'file-save',hypothesisId:'FILE_SAVE'})}).catch(()=>{});
    // #endregion
    console.log(`[FileSaver] 缩略图已保存: ${filename}`);
  } catch (error: any) {
    console.error('[FileSaver] 保存缩略图失败:', error);
    throw error;
  }
}

/**
 * 保存截图和缩略图
 */
export async function saveScreenshotWithThumbnail(
  base64Image: string,
  candidateName: string,
  candidateIndex: number,
  sessionDir: string
): Promise<void> {
  try {
    // 并行保存原图和缩略图
    await Promise.all([
      saveScreenshotToFile(base64Image, candidateName, candidateIndex, sessionDir),
      saveThumbnailToFile(base64Image, candidateName, candidateIndex, sessionDir),
    ]);
    
    console.log(`[FileSaver] 截图和缩略图已保存: ${candidateName}`);
  } catch (error: any) {
    console.error('[FileSaver] 保存失败:', error);
    // 不抛出错误，避免影响主流程
  }
}

