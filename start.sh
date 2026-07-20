#!/bin/bash
# 快速启动项目

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "Starting 2025-blog dev server..."

# 如果之前有运行，先关闭
if [ -f .dev.pid ]; then
  PID=$(cat .dev.pid)
  if ps -p $PID > /dev/null; then
    echo "Killing existing process (PID: $PID)..."
    kill $PID
  fi
  rm .dev.pid
fi

# 也可以直接杀掉占用 2025 端口的进程以防万一
PORT_PID=$(lsof -ti:2025)
if [ ! -z "$PORT_PID" ]; then
  echo "Killing process on port 2025 (PID: $PORT_PID)..."
  kill -9 $PORT_PID
fi

echo "Project starting! Running on port 2025."
echo "Press Control + C to stop the server."
echo "-----------------------------------"

npm run dev
