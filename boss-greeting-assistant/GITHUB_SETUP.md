# GitHub仓库设置指南

## 步骤1：在GitHub上创建新仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `boss-greeting-assistant` (或你喜欢的名称)
   - **Description**: `AI驱动的Boss直聘候选人智能筛选与自动打招呼Chrome扩展`
   - **Visibility**: 
     - 如果卖给客户：选择 **Private** (私有仓库)
     - 如果开源：选择 **Public** (公开仓库)
   - **不要**勾选 "Initialize this repository with a README" (我们已经有了)
4. 点击 "Create repository"

## 步骤2：推送代码到GitHub

创建仓库后，GitHub会显示推送代码的命令。执行以下命令：

```bash
cd "/Users/yingdao/Documents/Project/BOSS打招呼插件/boss-greeting-assistant"

# 添加远程仓库（将 YOUR_USERNAME 替换为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/boss-greeting-assistant.git

# 或者使用SSH（如果你配置了SSH密钥）
# git remote add origin git@github.com:YOUR_USERNAME/boss-greeting-assistant.git

# 推送代码
git push -u origin main
```

## 步骤3：验证

推送成功后，访问你的GitHub仓库页面，应该能看到所有代码文件。

## 后续更新代码

如果以后修改了代码，使用以下命令更新：

```bash
git add .
git commit -m "描述你的更改"
git push
```

## 注意事项

1. **敏感信息**：确保 `.gitignore` 已正确配置，不要提交：
   - API Keys
   - 环境变量文件 (.env)
   - node_modules/
   - dist/ (构建产物)

2. **许可证**：如果需要，可以添加 LICENSE 文件

3. **私有仓库**：如果这是商业项目，建议使用私有仓库，然后通过GitHub的协作者功能或组织功能分享给客户

