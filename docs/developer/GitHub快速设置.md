# 🚀 GitHub快速设置 - 5分钟完成

> 让HR可以直接从GitHub下载最新版本

---

## ✅ 已完成的工作

- ✅ GitHub Actions工作流已配置
- ✅ 自动构建和发布流程已设置
- ✅ 文档已准备就绪

---

## 📋 你需要做的（3步）

### 第一步：创建GitHub仓库

1. 访问：https://github.com/new
2. 填写信息：
   - **Repository name**: `boss-greeting-assistant`
   - **Description**: "Boss招聘智能助手 - Chrome扩展"
   - **Visibility**: 
     - **Private**（推荐）：只有授权用户可访问
     - **Public**：所有人可访问
   - **不要**勾选任何初始化选项
3. 点击"Create repository"
4. **复制仓库地址**（HTTPS），例如：
   ```
   https://github.com/你的用户名/boss-greeting-assistant.git
   ```

### 第二步：推送代码到GitHub

在项目目录下运行：

```bash
cd "/Users/yingdao/Documents/Project/BOSS打招呼插件"

# 初始化Git（如果还没有）
git init

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/boss-greeting-assistant.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Boss招聘智能助手 v1.0.0"

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 第三步：创建第一个Release

**方法一：自动发布（推荐）**

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签（这会触发GitHub Actions自动构建和发布）
git push origin v1.0.0
```

等待2-3分钟，GitHub Actions会自动：
- ✅ 构建生产版本
- ✅ 移除调试代码
- ✅ 打包成ZIP
- ✅ 创建Release并上传文件

**方法二：手动发布**

1. 访问：`https://github.com/你的用户名/boss-greeting-assistant/releases/new`
2. 填写：
   - **Tag version**: `v1.0.0`
   - **Release title**: `Boss招聘智能助手 v1.0.0`
   - **Description**: 复制下面的模板
3. 上传本地构建的ZIP文件（`boss-greeting-assistant-v1.0.0.zip`）
4. 点击"Publish release"

---

## 🎯 HR如何使用

### 给HR的下载链接

```
https://github.com/你的用户名/boss-greeting-assistant/releases/latest
```

### HR操作步骤

1. **访问下载页面**
   - 打开上面的链接
   - 或访问仓库首页 → 点击"Releases"

2. **下载最新版本**
   - 找到最新版本（通常在最上面）
   - 点击 `boss-greeting-assistant-v1.0.0.zip` 下载

3. **安装插件**
   - 按照 [HR安装使用指南](docs/HR安装使用指南.md) 安装

---

## 🔐 访问权限设置（如果是私有仓库）

### 给HR访问权限

1. **访问仓库设置**
   - 仓库页面 → "Settings" → "Collaborators"

2. **添加HR**
   - 点击"Add people"
   - 输入HR的GitHub用户名或邮箱
   - 权限选择：**Read**（只读）
   - 发送邀请

3. **HR接受邀请**
   - HR会收到邮件
   - 点击接受即可访问

### 或者：设置Releases公开访问

即使仓库是私有的，也可以设置Releases公开：
- 仓库设置 → 启用"Releases"的公开访问
- HR可以直接访问Releases页面下载

---

## 🔄 后续更新流程

### 发布新版本（超简单）

```bash
# 1. 更新代码并提交
git add .
git commit -m "feat: 新功能描述"
git push

# 2. 更新版本号（可选）
# 编辑 boss-greeting-assistant/package.json，修改version

# 3. 创建新版本标签
git tag v1.0.1
git push origin v1.0.1
```

**完成！** GitHub Actions会自动构建和发布，HR可以从Releases页面下载新版本。

---

## 📝 Release说明模板

发布新版本时，可以使用以下模板：

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

### 📚 文档
- [HR安装使用指南](docs/HR安装使用指南.md)
- [快速分发指南](../user/快速分发指南.md)

### 🔐 安全
- ✅ 已移除所有调试代码
- ✅ API Key仅存储在本地
```

---

## ✅ 完成检查清单

- [ ] GitHub仓库已创建
- [ ] 代码已推送到GitHub
- [ ] 第一个Release已创建
- [ ] HR有访问权限（如果是私有仓库）
- [ ] 已测试下载链接

---

## 🎉 完成！

现在HR可以：
- ✅ 访问GitHub Releases页面
- ✅ 下载最新版本
- ✅ 自动获取更新

**HR下载链接：**
```
https://github.com/你的用户名/boss-greeting-assistant/releases/latest
```

---

## 📞 需要帮助？

- **详细步骤**：查看 [GitHub设置步骤.md](docs/GitHub设置步骤.md)
- **发布指南**：查看 [GitHub发布指南.md](docs/GitHub发布指南.md)
- **HR指南**：查看 [HR-GitHub下载指南.md](docs/HR-GitHub下载指南.md)

---

**最后更新**：2025-01-29

