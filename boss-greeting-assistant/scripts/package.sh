#!/bin/bash

# Boss招聘智能助手 - 打包脚本
# 用于生成可分发给HR的插件文件

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Boss招聘智能助手 - 打包工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 获取版本号
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="boss-greeting-assistant-v${VERSION}"
OUTPUT_DIR="../dist-package"

echo -e "${YELLOW}版本号: ${VERSION}${NC}"
echo ""

# 清理旧的打包文件
echo -e "${BLUE}[1/4] 清理旧文件...${NC}"
rm -rf "$OUTPUT_DIR"
rm -f "../${PACKAGE_NAME}.zip"
rm -f "../${PACKAGE_NAME}.crx"
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 构建项目（使用生产构建）
echo -e "${BLUE}[2/4] 构建项目（生产模式）...${NC}"
npm run build:prod
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 构建完成（已移除调试代码）${NC}"
echo ""

# 创建打包目录
echo -e "${BLUE}[3/4] 创建打包文件...${NC}"
mkdir -p "$OUTPUT_DIR"

# 复制dist目录
cp -r dist/* "$OUTPUT_DIR/"

# 创建安装说明文件
cat > "$OUTPUT_DIR/安装说明.txt" << EOF
Boss招聘智能助手 - 安装说明
版本: ${VERSION}
日期: $(date +%Y-%m-%d)

安装步骤：
1. 打开Chrome浏览器
2. 访问 chrome://extensions/
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择这个文件夹（dist-package）

详细说明请查看：docs/HR安装使用指南.md
EOF

echo -e "${GREEN}✓ 打包文件创建完成${NC}"
echo ""

# 创建ZIP压缩包
echo -e "${BLUE}[4/4] 创建压缩包...${NC}"
cd ..
zip -r "${PACKAGE_NAME}.zip" dist-package/ -x "*.DS_Store" "*.git*" > /dev/null
echo -e "${GREEN}✓ ZIP压缩包创建完成: ${PACKAGE_NAME}.zip${NC}"
echo ""

# 提示创建CRX文件（需要手动操作）
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}打包完成！${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "生成的文件："
echo -e "  📦 ${GREEN}${PACKAGE_NAME}.zip${NC} - 可直接分发给HR"
echo -e "  📁 ${GREEN}dist-package/${NC} - 解压后的文件夹"
echo ""
echo -e "分发方式："
echo -e "  1. ${BLUE}ZIP文件${NC}：将 ${PACKAGE_NAME}.zip 发送给HR，让他们解压后加载"
echo -e "  2. ${BLUE}文件夹${NC}：将 dist-package 文件夹压缩后发送"
echo ""
echo -e "如需创建 .crx 文件（双击安装）："
echo -e "  1. 打开 chrome://extensions/"
echo -e "  2. 开启开发者模式"
echo -e "  3. 点击'打包扩展程序'"
echo -e "  4. 选择 dist-package 目录"
echo -e "  5. 生成 .crx 文件"
echo ""

