#!/bin/bash

# GitHub仓库设置脚本
# 用于清空旧文件并上传新代码

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REPO_URL="https://github.com/Genlei-Wang/HR_Agent_Boss.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub仓库设置 - 清空并上传新代码${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}仓库地址: ${REPO_URL}${NC}"
echo ""

# 检查是否是Git仓库
if [ -d ".git" ]; then
    echo -e "${BLUE}[1/5] 检查Git状态...${NC}"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  发现未提交的更改${NC}"
        read -p "是否先提交这些更改？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "chore: 更新代码"
        fi
    fi
    
    # 检查远程仓库
    CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$CURRENT_REMOTE" ]; then
        echo -e "${GREEN}✓ 当前远程仓库: ${CURRENT_REMOTE}${NC}"
        if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
            echo -e "${YELLOW}⚠️  远程仓库地址不匹配${NC}"
            read -p "是否更新为 ${REPO_URL}? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git remote set-url origin "$REPO_URL"
                echo -e "${GREEN}✓ 已更新远程仓库地址${NC}"
            fi
        fi
    else
        echo -e "${BLUE}添加远程仓库...${NC}"
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✓ 已添加远程仓库${NC}"
    fi
else
    echo -e "${BLUE}[1/5] 初始化Git仓库...${NC}"
    git init
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ Git仓库已初始化${NC}"
fi

echo ""

# 获取远程分支信息
echo -e "${BLUE}[2/5] 获取远程仓库信息...${NC}"
git fetch origin || echo -e "${YELLOW}⚠️  无法获取远程信息（可能是空仓库）${NC}"
echo ""

# 添加所有文件
echo -e "${BLUE}[3/5] 添加文件...${NC}"
git add .
echo -e "${GREEN}✓ 文件已添加${NC}"
echo ""

# 提交
echo -e "${BLUE}[4/5] 提交更改...${NC}"
git commit -m "chore: 更新Boss招聘智能助手 v1.0.0

- 重构项目结构
- 添加AI智能匹配功能
- 添加自动打招呼功能
- 优化用户体验
- 添加安全措施
- 添加GitHub Actions自动构建" || echo -e "${YELLOW}⚠️  没有新更改需要提交${NC}"
echo ""

# 推送到GitHub（强制覆盖）
echo -e "${BLUE}[5/5] 推送到GitHub...${NC}"
echo -e "${YELLOW}⚠️  这将覆盖远程仓库的所有内容${NC}"
read -p "确认继续？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git branch -M main
    git push -u origin main --force
    echo -e "${GREEN}✓ 代码已推送到GitHub${NC}"
    echo ""
    
    # 创建版本标签
    echo -e "${BLUE}创建版本标签...${NC}"
    git tag -f v1.0.0
    git push origin v1.0.0 --force
    echo -e "${GREEN}✓ 版本标签已创建并推送${NC}"
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ 完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "仓库地址: ${BLUE}${REPO_URL}${NC}"
    echo -e "Releases: ${BLUE}https://github.com/Genlei-Wang/HR_Agent_Boss/releases${NC}"
    echo ""
    echo -e "${YELLOW}HR下载链接:${NC}"
    echo -e "${BLUE}https://github.com/Genlei-Wang/HR_Agent_Boss/releases/latest${NC}"
    echo ""
else
    echo -e "${YELLOW}已取消推送${NC}"
fi

