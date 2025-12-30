#!/usr/bin/env node

/**
 * 构建后处理脚本：移除所有调试日志
 * 在生产构建后运行，确保不泄露任何敏感信息
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');

// 需要移除的模式
const DEBUG_PATTERNS = [
  // 调试服务器地址
  /fetch\s*\(\s*['"]http:\/\/127\.0\.0\.1:7242[^'"]*['"]/g,
  // 调试日志区域标记
  /\/\/\s*#region\s+agent\s+log[\s\S]*?\/\/\s*#endregion/g,
  // console.log/error/warn（保留必要的错误日志）
  /console\.(log|debug|info)\s*\([^)]*\)/g,
];

// 需要保留的console.error（重要错误）
const KEEP_ERRORS = [
  /console\.error\s*\([^)]*API\s+Key[^)]*\)/i,
  /console\.error\s*\([^)]*Error[^)]*\)/i,
];

function shouldKeepError(line) {
  return KEEP_ERRORS.some(pattern => pattern.test(line));
}

function removeDebugLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 移除调试服务器fetch调用（处理压缩后的代码）
    // 匹配 fetch("http://127.0.0.1:7242...") 及其后续的 .catch(()=>{})
    content = content.replace(/fetch\(["']http:\/\/127\.0\.0\.1:7242[^"']*["'][\s\S]*?\)\.catch\(\(\)=>\{\}\)/g, '');
    
    // 更彻底的匹配：匹配整个fetch调用链
    content = content.replace(/fetch\(["']http:\/\/127\.0\.0\.1:7242[^"']*["'][\s\S]*?catch\([^)]*\)/g, '');
    
    // 移除调试日志区域标记
    content = content.replace(/\/\/\s*#region\s+agent\s+log[\s\S]*?\/\/\s*#endregion/g, '');
    
    // 移除console.log/debug/info（但保留重要的console.error）
    const lines = content.split('\n');
    const cleanedLines = lines.map(line => {
      // 保留重要的console.error
      if (line.includes('console.error') && shouldKeepError(line)) {
        return line;
      }
      // 移除console.log/debug/info
      if (/console\.(log|debug|info)\s*\(/.test(line)) {
        return '';
      }
      return line;
    });
    content = cleanedLines.join('\n');
    
    // 清理多余的空行和逗号
    content = content.replace(/\n{4,}/g, '\n\n\n');
    content = content.replace(/,\s*,/g, ','); // 移除连续逗号
    content = content.replace(/,\s*\}/g, '}'); // 移除对象末尾的逗号
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`处理文件失败: ${filePath}`, error);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let processedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processedCount += processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      if (removeDebugLogs(filePath)) {
        processedCount++;
        console.log(`✓ 已清理: ${filePath}`);
      }
    }
  }
  
  return processedCount;
}

// 修复 Service Worker Loader 的导入路径
function fixServiceWorkerLoader() {
  const swLoaderPath = path.join(DIST_DIR, 'service-worker-loader.js');
  if (!fs.existsSync(swLoaderPath)) {
    console.log('⚠️  service-worker-loader.js 不存在，跳过修复');
    return false;
  }
  
  let content = fs.readFileSync(swLoaderPath, 'utf8');
  const originalContent = content;
  
  // 将相对路径改为绝对路径（Chrome Extension Manifest V3 要求）
  // './assets/...' -> '/assets/...'
  content = content.replace(/import\s+['"]\.\/assets\/([^'"]+)['"]/g, "import '/assets/$1'");
  
  if (content !== originalContent) {
    fs.writeFileSync(swLoaderPath, content, 'utf8');
    console.log(`✓ 已修复: ${swLoaderPath}`);
    return true;
  }
  
  return false;
}

// 修复 Service Worker 主文件中的相对路径导入
function fixServiceWorkerImports() {
  const swMainPath = path.join(DIST_DIR, 'assets', 'index.ts-CoG0h6cX.js');
  if (!fs.existsSync(swMainPath)) {
    console.log('⚠️  Service Worker 主文件不存在，跳过修复');
    return false;
  }
  
  let content = fs.readFileSync(swMainPath, 'utf8');
  const originalContent = content;
  
  // 将相对路径改为绝对路径
  // from"./message-types-18-naiTu.js" -> from"/assets/message-types-18-naiTu.js"
  // from"./ai-service.interface-RTMlAnJW.js" -> from"/assets/ai-service.interface-RTMlAnJW.js"
  content = content.replace(/from["']\.\/([^"']+)["']/g, 'from"/assets/$1"');
  
  if (content !== originalContent) {
    fs.writeFileSync(swMainPath, content, 'utf8');
    console.log(`✓ 已修复: ${swMainPath}`);
    return true;
  }
  
  return false;
}

// 主函数
function main() {
  console.log('========================================');
  console.log('移除调试日志 - 生产构建后处理');
  console.log('========================================');
  console.log('');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist目录不存在，请先运行 npm run build');
    process.exit(1);
  }
  
  console.log(`处理目录: ${DIST_DIR}`);
  console.log('');
  
  // 先修复 Service Worker Loader 和主文件
  fixServiceWorkerLoader();
  fixServiceWorkerImports();
  console.log('');
  
  const processedCount = processDirectory(DIST_DIR);
  
  console.log('');
  console.log('========================================');
  console.log(`✓ 完成！已处理 ${processedCount} 个文件`);
  console.log('========================================');
}

main();

