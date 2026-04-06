@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules" (
  echo 正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络或使用 pnpm install
    pause
    exit /b 1
  )
)

echo 启动官网开发服务 http://localhost:5000
call npm run dev
pause
