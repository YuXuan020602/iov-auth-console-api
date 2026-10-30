#!/bin/sh
# 云端启动脚本（由 build.sh 复制到 dist/run.sh，runtime 根目录即 dist/）
# 必须前台运行并透传退出码；端口由 PORT 环境变量决定（NestJS 内读取，默认 3000）

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo 'DATABASE_URL 未设置，无法连接数据库' >&2
  exit 1
fi

exec node src/main.js
