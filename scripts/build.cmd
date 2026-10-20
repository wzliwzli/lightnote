@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo 没找到 Node.js，请先安装：https://nodejs.org
  pause
  exit /b 1
)

echo [1/2] 类型检查
node node_modules\typescript\bin\tsc --noEmit
if errorlevel 1 goto :fail

echo [2/2] 打包成单文件
node node_modules\vite\bin\vite.js build
if errorlevel 1 goto :fail

echo.
echo 打包完成：dist\index.html（双击即可打开）
start "" "%~dp0..\dist\index.html"
goto :eof

:fail
echo.
echo 构建失败，请看上面的报错信息。
pause
