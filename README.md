# Boss招聘智能助手

> Chrome浏览器扩展，通过AI自动识别候选人工作经历，批量完成候选人筛选与打招呼操作。

---

## 📥 快速下载

### 最新版本

**GitHub Releases：** [下载最新版本](https://github.com/Genlei-Wang/HR_Agent_Boss/releases/latest)

**当前版本：** v1.0.0

### 安装步骤

1. 下载 `boss-greeting-assistant-v1.0.0.zip`
2. 解压文件
3. 打开Chrome浏览器 → `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

**详细说明：** [HR安装使用指南](docs/HR安装使用指南.md)

---

## 🚀 功能特性

- 🤖 **AI智能匹配**：使用Gemini API分析候选人简历
- 🎯 **精准筛选**：基于职位描述智能匹配候选人
- 💬 **自动打招呼**：匹配成功后自动发送打招呼消息
- 📊 **运行日志**：详细记录每次运行的操作日志
- 📜 **历史记录**：保存历史运行记录，支持导出
- 🛡️ **风控机制**：随机延迟、每日限制等机制
- 🎨 **现代化UI**：基于React + TypeScript + Tailwind CSS

---

## 📚 文档导航

### 用户文档
- [HR安装使用指南](docs/HR安装使用指南.md) - 给HR的详细安装和使用说明
- [HR-GitHub下载指南](docs/HR-GitHub下载指南.md) - 如何从GitHub下载最新版本
- [快速分发指南](快速分发指南.md) - 快速打包和分发流程

### 技术文档
- [IT部署指南](docs/IT部署指南.md) - 企业级部署方案
- [安全与隐私说明](docs/安全与隐私说明.md) - 数据安全和隐私保护
- [生产构建指南](docs/生产构建指南.md) - 如何构建生产版本

### 开发文档
- [GitHub发布指南](docs/GitHub发布指南.md) - 如何发布新版本
- [GitHub设置步骤](docs/GitHub设置步骤.md) - 如何设置GitHub仓库

---

## 🔐 安全说明

- ✅ API Key仅存储在本地，不会上传到服务器
- ✅ 所有数据仅存储在本地浏览器
- ✅ 生产版本已移除所有调试代码
- ✅ 支持Mac和Windows，不同分辨率

**详细说明：** [安全与隐私说明](docs/安全与隐私说明.md)

---

## 🛠️ 开发指南

### 本地开发

```bash
cd boss-greeting-assistant
npm install
npm run dev
```

### 构建生产版本

```bash
npm run build:prod
npm run package:prod
```

### 发布新版本

1. 更新版本号（`package.json`）
2. 更新 `CHANGELOG.md`
3. 创建Git标签：`git tag v1.0.1`
4. 推送标签：`git push origin v1.0.1`
5. GitHub Actions会自动构建和发布

**详细说明：** [GitHub发布指南](docs/GitHub发布指南.md)

---

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细更新内容。

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

## 📄 许可证

本项目为商业软件，未经授权不得复制、分发或销售。

---

## 📞 支持

- **技术支持**：联系项目负责人
- **问题反馈**：提交GitHub Issue

---

**最后更新**：2025-01-29
