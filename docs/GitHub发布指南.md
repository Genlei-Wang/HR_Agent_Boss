# GitHub发布指南

> 📦 如何通过GitHub Releases发布插件，让HR直接下载最新版本

---

## 🚀 快速发布流程

### 方式一：使用GitHub Actions自动发布（推荐）

1. **创建版本标签**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **自动构建和发布**
   - GitHub Actions会自动：
     - ✅ 构建生产版本
     - ✅ 移除调试代码
     - ✅ 打包成ZIP文件
     - ✅ 创建Release并上传文件

3. **HR下载**
   - HR访问：`https://github.com/Genlei-Wang/HR_Agent_Boss/releases`
   - 下载最新版本的ZIP文件

### 方式二：手动发布

1. **本地构建**
   ```bash
   cd boss-greeting-assistant
   npm run package:prod
   ```

2. **创建Release**
   - 访问GitHub仓库
   - 点击"Releases" → "Create a new release"
   - 填写版本号（如：v1.0.0）
   - 上传 `boss-greeting-assistant-v1.0.0.zip`
   - 填写发布说明
   - 点击"Publish release"

---

## 📋 发布前检查清单

- [ ] 代码已提交到GitHub
- [ ] 已更新 `CHANGELOG.md`
- [ ] 已更新版本号（`package.json`）
- [ ] 已测试生产构建
- [ ] 已确认无调试代码
- [ ] 已确认无敏感信息泄露

---

## 🔐 安全注意事项

### ✅ 必须检查

1. **无硬编码API Key**
   ```bash
   grep -r "AIzaSy" boss-greeting-assistant/src/
   # 应该没有输出
   ```

2. **无调试服务器地址**
   ```bash
   grep -r "127.0.0.1:7242" boss-greeting-assistant/dist/
   # 应该没有输出
   ```

3. **无敏感信息**
   - 检查 `.gitignore` 是否包含敏感文件
   - 检查是否有 `.env` 文件被提交

### 📝 .gitignore 检查

确保以下文件/目录在 `.gitignore` 中：
```
# 构建输出
boss-greeting-assistant/dist/
boss-greeting-assistant/dist-package/
boss-greeting-assistant-v*.zip

# 敏感信息
*.env
*.key
*.pem

# 调试文件
.cursor/debug.log
*.log
```

---

## 🏷️ 版本号管理

### 版本号格式

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：
- `主版本号.次版本号.修订号`
- 例如：`1.0.0`, `1.1.0`, `1.0.1`

### 更新版本号

1. **更新 package.json**
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **更新 CHANGELOG.md**
   - 添加新版本的更新日志

3. **提交并推送**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git push
   ```

4. **创建标签**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

---

## 📦 Release说明模板

```markdown
## Boss招聘智能助手 v1.0.0

### 📦 下载安装包
点击下方下载按钮，下载 `boss-greeting-assistant-v1.0.0.zip`

### 📖 安装步骤
1. 解压ZIP文件
2. 打开Chrome浏览器 → `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的文件夹

### ✨ 新功能
- AI智能匹配候选人
- 自动打招呼功能
- 运行日志记录

### 🔧 修复
- 修复截图定位问题
- 优化配置保存逻辑

### 📚 文档
- [HR安装使用指南](docs/HR安装使用指南.md)
- [快速分发指南](快速分发指南.md)

### 🔐 安全
- ✅ 已移除所有调试代码
- ✅ API Key仅存储在本地
```

---

## 🔄 更新流程

### HR如何获取更新

1. **访问GitHub Releases**
   - URL：`https://github.com/Genlei-Wang/HR_Agent_Boss/releases`

2. **下载最新版本**
   - 找到最新版本
   - 下载ZIP文件

3. **更新插件**
   - 卸载旧版本（`chrome://extensions/` → 移除）
   - 安装新版本（加载已解压的扩展程序）

### 自动更新（未来）

如果发布到Chrome Web Store，可以启用自动更新。

---

## 📊 GitHub Actions说明

### 自动构建流程

1. **触发条件**
   - 推送版本标签（`v*`）
   - 手动触发（workflow_dispatch）

2. **构建步骤**
   - 安装依赖
   - 构建生产版本
   - 移除调试代码
   - 打包成ZIP
   - 创建Release

3. **构建产物**
   - `boss-greeting-assistant-v*.zip`
   - 自动上传到Release

---

## 🛠️ 故障排除

### Q: GitHub Actions构建失败？

**检查：**
1. Node.js版本是否正确（需要18+）
2. 依赖是否完整（`package-lock.json` 是否存在）
3. 构建脚本是否正确

**解决：**
```bash
# 本地测试构建
cd boss-greeting-assistant
npm ci
npm run build:prod
```

### Q: Release没有自动创建？

**检查：**
1. 标签格式是否正确（必须是 `v*`）
2. GitHub Actions是否启用
3. 是否有权限创建Release

**解决：**
- 手动创建Release
- 检查仓库设置 → Actions权限

### Q: HR无法下载？

**检查：**
1. 仓库是否为公开（或HR有访问权限）
2. Release是否已发布（不是草稿）
3. ZIP文件是否上传成功

**解决：**
- 确保仓库可见性设置正确
- 检查Release状态

---

## 📞 支持

如有问题，请联系项目负责人。

---

**最后更新**：2025-01-29

