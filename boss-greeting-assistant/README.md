# HR Agent：Boss招聘打招呼、要简历

一个基于AI的Chrome扩展，用于自动化Boss直聘平台的候选人筛选和打招呼流程。

## 功能特性

- 🤖 **AI智能匹配**：使用Gemini 2.5 Flash模型分析候选人简历，自动判断是否符合JD要求
- 🎯 **精准筛选**：基于职位描述（JD）智能匹配候选人，提高招聘效率
- 💬 **自动打招呼**：匹配成功后自动发送打招呼消息
- 📊 **运行日志**：详细记录每次运行的操作日志和统计信息
- 📜 **历史记录**：保存历史运行记录，支持查看和导出
- 🛡️ **风控机制**：随机延迟、每日限制等机制，降低封号风险
- 🎨 **现代化UI**：基于React + TypeScript + Tailwind CSS构建的优雅界面

## 技术栈

- **前端框架**：React 18 + TypeScript
- **样式方案**：Tailwind CSS
- **状态管理**：Zustand
- **构建工具**：Vite + CRXJS
- **AI模型**：Google Gemini 2.5 Flash API
- **扩展标准**：Chrome Manifest V3

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd boss-greeting-assistant
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

### 4. 加载扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `dist` 目录

## 配置说明

### API Key配置

1. 获取Gemini API Key：
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建新的API Key

2. 在扩展中配置：
   - 打开扩展侧边栏
   - 在"API Key配置"中输入你的API Key
   - 点击"测试连接"验证
   - 点击"保存"

**注意**：Gemini API免费版每天限制20次请求。如需更多配额，请升级到付费计划。

### 职位描述（JD）配置

在"职位描述"文本框中输入你的招聘要求，例如：

```
候选人-工作经历，要和B端、SaaS、工具产品、AI产品相关；不要和纯to C产品、垂直医疗、垂直教育、大客户定制产品相关。
```

## 使用方法

1. **打开Boss直聘**：访问 [Boss直聘推荐牛人页面](https://www.zhipin.com/web/chat/recommend)

2. **配置参数**：
   - 设置要处理的候选人数量（默认5人）
   - 确认API Key和JD描述已配置

3. **开始运行**：
   - 点击"开始打招呼"按钮
   - 扩展会自动分析候选人并发送打招呼消息

4. **查看日志**：
   - 在"运行日志"区域查看详细的操作记录
   - 可以查看历史运行记录
   - 支持导出日志为TXT文件

## 项目结构

```
boss-greeting-assistant/
├── src/
│   ├── background/          # Background Service Worker
│   │   ├── index.ts         # 消息处理和任务编排
│   │   ├── gemini-service.ts # Gemini API服务
│   │   ├── screenshot-service.ts # 截图服务
│   │   └── debug-logger.ts  # 调试日志
│   ├── content/             # Content Script
│   │   ├── index.ts         # Content Script入口
│   │   ├── automation-controller.ts # 自动化控制器
│   │   ├── candidate-extractor.ts # 候选人信息提取
│   │   ├── candidate-handler.ts # 候选人处理逻辑
│   │   ├── dom-selectors.ts # DOM选择器定义
│   │   └── risk-control.ts  # 风控逻辑
│   ├── sidepanel/           # 侧边栏UI
│   │   ├── App.tsx          # 主应用组件
│   │   ├── components/     # UI组件
│   │   ├── contexts/        # React Context
│   │   ├── hooks/          # 自定义Hooks
│   │   └── store/          # Zustand状态管理
│   └── shared/             # 共享代码
│       ├── types.ts        # TypeScript类型定义
│       ├── constants.ts    # 常量配置
│       ├── message-types.ts # 消息类型定义
│       ├── prompts.ts      # AI提示词模板
│       └── utils.ts        # 工具函数
├── public/                  # 静态资源
│   ├── manifest.json       # Chrome扩展清单
│   └── icons/              # 图标文件
└── dist/                   # 构建输出（不提交到Git）

```

## 开发指南

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

## 注意事项

1. **API配额限制**：Gemini API免费版每天限制20次请求，请合理使用
2. **风控建议**：建议设置合理的延迟时间，避免频繁操作
3. **合规使用**：请遵守Boss直聘的使用条款，合理使用自动化工具
4. **数据安全**：API Key等敏感信息仅存储在本地，不会上传到服务器

## 许可证

本项目为商业软件，未经授权不得复制、分发或销售。

## 联系方式

如有问题或需要技术支持，请联系开发者。

## 更新日志

### v1.0.0 (2025-01-XX)

- ✨ 初始版本发布
- ✨ AI智能匹配功能
- ✨ 自动打招呼功能
- ✨ 运行日志和历史记录
- ✨ Toast通知系统
- ✨ 风控机制
