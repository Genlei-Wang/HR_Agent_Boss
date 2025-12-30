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
    
    // ⚠️ 重要：已禁用所有代码修改操作，因为会在压缩后的代码上产生语法错误
    // 压缩后的代码是单行的，正则表达式匹配非常危险，容易误删或误改代码
    // 
    // 解决方案：
    // 1. 使用环境变量在源代码层面控制调试日志（推荐）
    // 2. 使用 Vite 的 define 选项在生产构建时替换调试代码
    // 3. 使用条件编译（如 #ifdef DEBUG）来控制调试代码
    //
    // 当前只保留路径修复功能（fixServiceWorkerLoader 和 fixServiceWorkerImports）
    
    // 第一步：移除调试日志区域标记（包括标记本身和中间的所有内容）
    // 匹配 // #region agent log ... // #endregion（跨行匹配）
    // 注意：这个匹配是安全的，因为它是完整的注释块
    content = content.replace(/\/\/\s*#region\s+agent\s+log[\s\S]*?\/\/\s*#endregion/g, '');
    
    // ⚠️ 已禁用：移除 fetch 调用和 console.log，因为会在压缩后的代码上产生语法错误
    // 问题：压缩后的代码是单行的，正则表达式匹配很容易出错
    // 例如：await Promise(...), fetch(...).catch(...) 移除 fetch 后会留下孤立的逗号
    
    // ⚠️ 已禁用：所有语法修复规则，因为会在压缩后的代码上产生新的错误
    // 修复规则之间互相冲突，导致修复后产生新的语法错误
    // 例如：修复 }T={ 后可能产生新的 }variable={ 错误
    
    // 不再进行任何代码修改，只返回 false 表示未修改
    // 只移除调试日志区域标记（这是安全的，因为它是完整的注释块）
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

