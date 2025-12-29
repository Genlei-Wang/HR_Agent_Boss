# Boss招聘智能助手 - IT部署指南

> 📖 面向IT部门的技术部署文档

---

## 📋 部署方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **手动加载** | 简单、快速 | 需要用户操作 | 小团队（<10人） |
| **CRX文件** | 双击安装 | 需要签名 | 中等团队（10-50人） |
| **企业策略** | 自动部署、统一管理 | 需要域控 | 大企业（>50人） |
| **Chrome Web Store** | 官方渠道、自动更新 | 需要审核 | 公开分发 |

---

## 🚀 方式一：手动加载（最简单）

### 适用场景
- 小团队（<10人）
- 快速部署
- 不需要统一管理

### 部署步骤

1. **打包插件**
   ```bash
   cd boss-greeting-assistant
   npm install
   npm run build
   ```

2. **分发文件**
   - 将 `dist` 文件夹压缩为 ZIP
   - 发送给HR，附上安装说明（见 `docs/HR安装使用指南.md`）

3. **用户安装**
   - 用户解压ZIP文件
   - 打开 `chrome://extensions/`
   - 开启开发者模式
   - 加载已解压的扩展程序
   - 选择 `dist` 文件夹

### 优点
- ✅ 无需IT支持
- ✅ 快速部署
- ✅ 用户自主安装

### 缺点
- ❌ 需要用户操作
- ❌ 更新需要重新安装
- ❌ 无法统一管理

---

## 📦 方式二：CRX文件（推荐）

### 适用场景
- 中等团队（10-50人）
- 需要简化安装流程
- 不需要自动更新

### 创建CRX文件

#### 方法1：使用Chrome开发者工具（推荐）

1. **打包插件**
   ```bash
   cd boss-greeting-assistant
   npm run build
   ```

2. **加载到Chrome**
   - 打开 `chrome://extensions/`
   - 开启开发者模式
   - 加载已解压的扩展程序
   - 选择 `dist` 文件夹

3. **打包扩展程序**
   - 点击"打包扩展程序"按钮
   - 扩展程序根目录：选择 `dist` 文件夹
   - 私钥文件：留空（首次打包）
   - 点击"打包扩展程序"
   - 生成 `dist.crx` 和 `dist.pem` 文件

4. **保存私钥**
   - **重要**：保存 `dist.pem` 文件（用于后续更新）
   - 妥善保管，不要丢失

#### 方法2：使用命令行工具

```bash
# 安装 crx3 工具
npm install -g crx3

# 打包（需要先构建）
cd boss-greeting-assistant
npm run build
crx3 dist -o boss-greeting-assistant.crx
```

### 分发CRX文件

1. **发送文件**
   - 将 `.crx` 文件发送给HR
   - 附上安装说明

2. **用户安装**
   - 用户双击 `.crx` 文件
   - Chrome会提示安装
   - 点击"添加扩展程序"确认

### 更新CRX文件

1. **使用私钥打包**
   - 在"打包扩展程序"时，选择之前的 `.pem` 私钥文件
   - 生成的 `.crx` 文件会保持相同的扩展ID

2. **用户更新**
   - 用户重新安装新的 `.crx` 文件
   - Chrome会自动更新扩展

### 优点
- ✅ 双击安装，用户体验好
- ✅ 可以签名，更安全
- ✅ 支持更新

### 缺点
- ❌ 需要保存私钥
- ❌ 更新需要重新分发
- ❌ Chrome可能提示"未经验证的扩展"

---

## 🏢 方式三：企业策略部署（最专业）

### 适用场景
- 大企业（>50人）
- 需要统一管理
- 有域控或MDM系统

### Windows + Active Directory

#### 1. 准备CRX文件

```bash
cd boss-greeting-assistant
npm run build
# 使用Chrome开发者工具打包为CRX（见方式二）
```

#### 2. 配置组策略

1. **打开组策略编辑器**
   - `Win + R` → `gpedit.msc`
   - 或：服务器管理器 → 组策略管理

2. **配置Chrome扩展策略**
   - 路径：`计算机配置` → `管理模板` → `Google` → `Google Chrome` → `扩展程序`
   - 策略：`配置扩展程序安装白名单`
   - 启用，添加扩展ID（从manifest.json获取）

3. **部署CRX文件**
   - 将CRX文件放到网络共享位置
   - 配置组策略：`强制安装扩展程序和应用的列表`
   - 添加扩展ID和CRX文件路径

#### 3. 用户端配置

- 用户登录域后，扩展会自动安装
- 无需手动操作

### macOS + MDM

#### 1. 使用Jamf Pro

1. **创建配置描述文件**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>PayloadContent</key>
       <array>
           <dict>
               <key>PayloadType</key>
               <string>com.google.Chrome.extensions.extension-id</string>
               <key>PayloadIdentifier</key>
               <string>com.google.Chrome.extensions.extension-id</string>
               <key>PayloadUUID</key>
               <string>YOUR-UUID-HERE</string>
               <key>PayloadVersion</key>
               <integer>1</integer>
               <key>ExtensionID</key>
               <string>YOUR-EXTENSION-ID</string>
               <key>ExtensionUpdateURL</key>
               <string>https://your-server.com/extensions/boss-greeting-assistant.crx</string>
           </dict>
       </array>
       <key>PayloadDisplayName</key>
       <string>Boss招聘智能助手</string>
       <key>PayloadIdentifier</key>
       <string>com.company.chrome.extension</string>
       <key>PayloadType</key>
       <string>Configuration</string>
       <key>PayloadUUID</key>
       <string>YOUR-UUID-HERE</string>
       <key>PayloadVersion</key>
       <integer>1</integer>
   </dict>
   </plist>
   ```

2. **部署到设备**
   - 通过Jamf Pro推送配置描述文件
   - 设备会自动安装扩展

### 优点
- ✅ 自动部署，无需用户操作
- ✅ 统一管理，便于更新
- ✅ 可以强制安装，防止卸载

### 缺点
- ❌ 需要IT基础设施支持
- ❌ 配置复杂
- ❌ 需要维护

---

## 🌐 方式四：Chrome Web Store（公开分发）

### 适用场景
- 需要公开分发
- 需要自动更新
- 愿意接受Google审核

### 发布步骤

1. **准备材料**
   - 扩展图标（128x128, 48x48, 16x16）
   - 应用截图（1280x800或640x400）
   - 应用描述
   - 隐私政策URL

2. **打包扩展**
   ```bash
   cd boss-greeting-assistant
   npm run build
   # 将dist文件夹压缩为ZIP
   ```

3. **提交审核**
   - 访问：https://chrome.google.com/webstore/devconsole
   - 创建新项目
   - 上传ZIP文件
   - 填写应用信息
   - 提交审核

4. **审核通过后**
   - 用户可以从Chrome Web Store安装
   - 自动更新功能开启

### 优点
- ✅ 官方渠道，用户信任度高
- ✅ 自动更新
- ✅ 无需手动分发

### 缺点
- ❌ 需要Google审核（可能被拒）
- ❌ 需要支付开发者费用（一次性$5）
- ❌ 需要提供隐私政策

---

## 🔐 安全建议

### 1. 代码签名

- 使用私钥签名CRX文件
- 保存私钥文件，用于后续更新
- 不要将私钥文件分发给用户

### 2. 权限最小化

- 检查 `manifest.json` 中的权限
- 只申请必要的权限
- 避免过度权限

### 3. API Key管理

- **不要**将API Key硬编码到代码中
- 让用户自行配置API Key
- 考虑使用企业统一的API Key服务

### 4. 更新机制

- 建立更新通知机制
- 定期检查新版本
- 及时修复安全漏洞

---

## 📊 推荐方案

### 小团队（<10人）
👉 **方式一：手动加载**
- 简单快速
- 无需IT支持

### 中等团队（10-50人）
👉 **方式二：CRX文件**
- 用户体验好
- 易于分发

### 大企业（>50人）
👉 **方式三：企业策略**
- 统一管理
- 自动部署

### 公开分发
👉 **方式四：Chrome Web Store**
- 官方渠道
- 自动更新

---

## 🛠️ 技术支持

### 常见问题

**Q: 用户无法安装扩展？**
- 检查Chrome版本（需要Chrome 88+）
- 检查是否开启了开发者模式
- 检查文件路径是否正确

**Q: 扩展无法正常工作？**
- 检查API Key配置
- 检查网络连接
- 查看浏览器控制台错误信息

**Q: 如何更新扩展？**
- 重新打包CRX文件（使用相同私钥）
- 用户重新安装
- 或通过企业策略推送更新

### 联系支持

- 技术支持：联系项目负责人
- 问题反馈：提交Issue到项目仓库

---

**最后更新**：2025-01-29

