#!/bin/bash

# 乐星融合学校数字化教学管理系统启动脚本

echo "===================================="
echo "乐星融合学校管理系统"
echo "===================================="

# 检查是否安装了依赖
if [ ! -d "server/node_modules" ]; then
  echo "正在安装后端依赖..."
  cd server && pnpm install && cd ..
fi

if [ ! -d "website/node_modules" ]; then
  echo "正在安装官网依赖..."
  cd website && pnpm install && cd ..
fi

if [ ! -d "admin/node_modules" ]; then
  echo "正在安装管理后台依赖..."
  cd admin && pnpm install && cd ..
fi

# 启动后端服务
echo "启动后端 API 服务..."
cd server
pnpm dev > /app/work/logs/bypass/server.log 2>&1 &
SERVER_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动官网
echo "启动官网..."
cd website
pnpm dev > /app/work/logs/bypass/website.log 2>&1 &
WEBSITE_PID=$!
cd ..

# 启动管理后台
echo "启动管理后台..."
cd admin
pnpm dev --port 5001 > /app/work/logs/bypass/admin.log 2>&1 &
ADMIN_PID=$!
cd ..

# 等待前端启动
sleep 3

echo ""
echo "===================================="
echo "服务启动成功！"
echo "===================================="
echo "官网: http://localhost:5000"
echo "管理后台: http://localhost:5001"
echo "API 服务: http://localhost:3001"
echo "===================================="
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $SERVER_PID $WEBSITE_PID $ADMIN_PID 2>/dev/null; exit 0" INT TERM

# 保持脚本运行
wait
