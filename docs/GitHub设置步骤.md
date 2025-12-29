# GitHub仓库设置步骤

> 📝 如何设置GitHub仓库，让HR可以直接下载最新版本

---

## 🚀 第一步：创建GitHub仓库

### 1. 创建新仓库

1. 登录GitHub
2. 点击右上角"+" → "New repository"
3. 填写仓库信息：
   - **Repository name**: `boss-greeting-assistant`（或你喜欢的名字）
   - **Description**: "Boss招聘智能助手 - Chrome扩展"
   - **Visibility**: 
     - **Private**（推荐）：只有授权用户可访问
     - **Public**：所有人可访问
   - **不要**勾选"Initialize with README"（本地已有代码）

4. 点击"Create repository"

### 2. 获取仓库地址

复制仓库地址，例如：
- HTTPS: `https://github.com/你的用户名/boss-greeting-assistant.git`
- SSH: `git@github.com:你的用户名/boss-greeting-assistant.git`

---

## 📤 第二步：推送代码到GitHub

### 1. 初始化Git（如果还没有）

```bash
cd "/Users/yingdao/Documents/Project/BOSS打招呼插件"
git init
```

### 2. 添加远程仓库

```bash
git remote add origin https://github.com/你的用户名/boss-greeting-assistant.git
```

### 3. 添加文件并提交

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Boss招聘智能助手 v1.0.0"

# 推送到GitHub
git branch -M main
git push -u origin main
```

---

## ⚙️ 第三步：配置GitHub Actions

### 1. 启用GitHub Actions

- GitHub会自动检测 `.github/workflows/` 目录
- 无需额外配置

### 2. 验证工作流

1. 访问仓库页面
2. 点击"Actions"标签
3. 确认工作流已启用

---

## 🏷️ 第四步：创建第一个Release

### 方法一：使用GitHub Actions自动发布（推荐）

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0
```

GitHub Actions会自动：
- ✅ 构建生产版本
- ✅ 打包成ZIP
- ✅ 创建Release
- ✅ 上传文件

### 方法二：手动创建Release

1. 访问仓库页面
2. 点击"Releases" → "Create a new release"
3. 填写信息：
   - **Tag version**: `v1.0.0`
   - **Release title**: `Boss招聘智能助手 v1.0.0`
   - **Description**: 复制Release说明模板
4. 上传ZIP文件（如果手动创建）
5. 点击"Publish release"

---

## 🔐 第五步：设置访问权限（如果是私有仓库）

### 给HR访问权限

1. **访问仓库设置**
   - 点击仓库的"Settings"
   - 左侧菜单选择"Collaborators"

2. **添加协作者**
   - 点击"Add people"
   - 输入HR的GitHub用户名或邮箱
   - 选择权限：**Read**（只读）
   - 发送邀请

3. **HR接受邀请**
   - HR会收到邮件邀请
   - 点击接受即可访问

### 或者：使用GitHub Releases的公开访问

即使仓库是私有的，Releases也可以设置为公开访问：
- 在仓库设置中启用"Releases"的公开访问
- HR可以直接访问Releases页面下载

---

## 📋 第六步：更新README

### 更新仓库地址

编辑以下文件，替换仓库地址：

1. **`.github/README.md`**
   - 替换 `Genlei-Wang/HR_Agent_Boss` 为实际地址

2. **`docs/GitHub发布指南.md`**
   - 替换仓库地址

3. **`docs/HR-GitHub下载指南.md`**
   - 替换仓库地址

---

## ✅ 完成检查清单

- [ ] GitHub仓库已创建
- [ ] 代码已推送到GitHub
- [ ] GitHub Actions已启用
- [ ] 第一个Release已创建
- [ ] HR有访问权限（如果是私有仓库）
- [ ] README已更新仓库地址

---

## 🎯 HR如何使用

### 给HR的说明

1. **访问下载页面**
   ```
   https://github.com/Genlei-Wang/HR_Agent_Boss/releases
   ```

2. **下载最新版本**
   - 找到最新版本
   - 点击下载ZIP文件

3. **安装插件**
   - 按照 [HR安装使用指南.md](./HR安装使用指南.md) 安装

---

## 🔄 后续更新流程

### 发布新版本

1. **更新代码**
   ```bash
   git add .
   git commit -m "feat: 新功能描述"
   git push
   ```

2. **创建新版本标签**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **自动发布**
   - GitHub Actions会自动构建和发布
   - HR可以从Releases页面下载新版本

---

## 📞 故障排除

### Q: 推送失败？

**检查：**
- GitHub用户名和密码/Token是否正确
- 网络连接是否正常
- 仓库地址是否正确

**解决：**
```bash
# 检查远程仓库地址
git remote -v

# 重新设置（如果需要）
git remote set-url origin https://github.com/Genlei-Wang/HR_Agent_Boss.git
```

### Q: GitHub Actions没有运行？

**检查：**
1. 仓库设置 → Actions → 确认已启用
2. 工作流文件路径是否正确（`.github/workflows/`）
3. 文件格式是否正确（YAML语法）

### Q: HR无法访问？

**检查：**
1. 仓库是否为私有（需要添加协作者）
2. HR是否已接受邀请
3. Releases是否设置为公开访问

---

## 🎉 完成！

现在HR可以：
- ✅ 访问GitHub Releases页面
- ✅ 下载最新版本
- ✅ 自动获取更新

---

**最后更新**：2025-01-29

