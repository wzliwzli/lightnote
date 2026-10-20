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

echo 正在启动轻笺预览服务 http://127.0.0.1:5179/
node node_modules\vite\bin\vite.js --port 5179 --strictPort --host 127.0.0.1
pause
