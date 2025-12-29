@echo off
REM Boss招聘智能助手 - 打包脚本 (Windows)
REM 用于生成可分发给HR的插件文件

setlocal enabledelayedexpansion

echo ========================================
echo Boss招聘智能助手 - 打包工具
echo ========================================
echo.

REM 获取版本号
for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\"" package.json') do (
    set VERSION=%%a
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION: =!
)

set PACKAGE_NAME=boss-greeting-assistant-v%VERSION%
set OUTPUT_DIR=..\dist-package

echo 版本号: %VERSION%
echo.

REM 清理旧的打包文件
echo [1/4] 清理旧文件...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
if exist "..\%PACKAGE_NAME%.zip" del /q "..\%PACKAGE_NAME%.zip"
echo ✓ 清理完成
echo.

REM 构建项目
echo [2/4] 构建项目...
call npm run build
if errorlevel 1 (
    echo ✗ 构建失败
    exit /b 1
)
echo ✓ 构建完成
echo.

REM 创建打包目录
echo [3/4] 创建打包文件...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM 复制dist目录
xcopy /E /I /Y dist\* "%OUTPUT_DIR%\"

REM 创建安装说明文件
echo Boss招聘智能助手 - 安装说明 > "%OUTPUT_DIR%\安装说明.txt"
echo 版本: %VERSION% >> "%OUTPUT_DIR%\安装说明.txt"
echo 日期: %date% >> "%OUTPUT_DIR%\安装说明.txt"
echo. >> "%OUTPUT_DIR%\安装说明.txt"
echo 安装步骤： >> "%OUTPUT_DIR%\安装说明.txt"
echo 1. 打开Chrome浏览器 >> "%OUTPUT_DIR%\安装说明.txt"
echo 2. 访问 chrome://extensions/ >> "%OUTPUT_DIR%\安装说明.txt"
echo 3. 开启右上角的"开发者模式" >> "%OUTPUT_DIR%\安装说明.txt"
echo 4. 点击"加载已解压的扩展程序" >> "%OUTPUT_DIR%\安装说明.txt"
echo 5. 选择这个文件夹（dist-package） >> "%OUTPUT_DIR%\安装说明.txt"
echo. >> "%OUTPUT_DIR%\安装说明.txt"
echo 详细说明请查看：docs/HR安装使用指南.md >> "%OUTPUT_DIR%\安装说明.txt"

echo ✓ 打包文件创建完成
echo.

REM 创建ZIP压缩包（需要7-Zip或WinRAR）
echo [4/4] 创建压缩包...
cd ..
if exist "dist-package" (
    powershell Compress-Archive -Path dist-package\* -DestinationPath "%PACKAGE_NAME%.zip" -Force
    echo ✓ ZIP压缩包创建完成: %PACKAGE_NAME%.zip
) else (
    echo ✗ 打包目录不存在
    exit /b 1
)
echo.

echo ========================================
echo 打包完成！
echo ========================================
echo.
echo 生成的文件：
echo   📦 %PACKAGE_NAME%.zip - 可直接分发给HR
echo   📁 dist-package\ - 解压后的文件夹
echo.
echo 分发方式：
echo   1. ZIP文件：将 %PACKAGE_NAME%.zip 发送给HR，让他们解压后加载
echo   2. 文件夹：将 dist-package 文件夹压缩后发送
echo.
echo 如需创建 .crx 文件（双击安装）：
echo   1. 打开 chrome://extensions/
echo   2. 开启开发者模式
echo   3. 点击"打包扩展程序"
echo   4. 选择 dist-package 目录
echo   5. 生成 .crx 文件
echo.

pause

