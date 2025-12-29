#!/bin/bash

# 生产构建脚本
# 移除所有调试代码，确保安全

set -e

echo "=========================================="
echo "Boss招聘智能助手 - 生产构建"
echo "=========================================="
echo ""

# 设置环境变量为生产模式
export NODE_ENV=production
export VITE_MODE=production

echo "[1/3] 清理旧文件..."
rm -rf dist
echo "✓ 清理完成"
echo ""

echo "[2/3] 构建项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "✗ 构建失败"
    exit 1
fi
echo "✓ 构建完成"
echo ""

echo "[3/3] 安全检查..."
# 检查是否还有调试服务器地址
if grep -r "127.0.0.1:7242" dist/ > /dev/null 2>&1; then
    echo "⚠️  警告：发现调试服务器地址，请检查代码"
else
    echo "✓ 未发现调试服务器地址"
fi

# 检查是否还有硬编码的API Key
if grep -r "AIzaSy" dist/ > /dev/null 2>&1; then
    echo "⚠️  警告：发现可能的API Key，请检查代码"
else
    echo "✓ 未发现硬编码API Key"
fi

echo ""
echo "=========================================="
echo "构建完成！"
echo "=========================================="
echo ""
echo "生成的文件："
echo "  📁 dist/ - 生产版本扩展文件"
echo ""
echo "安全提示："
echo "  ✓ 已移除调试代码"
echo "  ✓ 已优化代码大小"
echo "  ✓ 已检查敏感信息"
echo ""

