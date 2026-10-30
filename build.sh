#!/bin/sh
# 云端构建脚本（FunctionWeb / nodejs20）
#
# 部署平台需要注入的环境变量：
#   DATABASE_URL     Postgres 连接串，如 postgresql://user:pass@host:5432/iov?schema=public&sslmode=require
#   PORT             运行端口，必须与执行配置里的 runtime.port 一致
#   JWT_SECRET       JWT 签名密钥
#   FRONTEND_ORIGIN  允许跨域的前端地址，如 https://xxx.example.com
#   SEED_ON_DEPLOY   设为 true 时在构建阶段写入种子数据（注意：seed 会先清空所有表）
#
# 产物布局（runtime 根目录为 dist/）：
#   dist/src/main.js    NestJS 编译产物
#   dist/node_modules   裁剪后的运行时依赖（含 Prisma Client 与查询引擎）
#   dist/run.sh         启动脚本

set -eu

export NPM_CONFIG_REGISTRY='https://registry.npmjs.org/'
PG_SCHEMA='prisma/schema.postgres.prisma'

echo '[build] 安装依赖'
npm ci --include=dev --registry='https://registry.npmjs.org/'

echo '[build] 校验两份 schema 的模型定义是否同步'
node scripts/check-schema-sync.mjs

echo '[build] 生成 Postgres 版 Prisma Client'
npx prisma generate --schema "$PG_SCHEMA"

echo '[build] 编译 NestJS'
npm run build

if [ -n "${DATABASE_URL:-}" ]; then
  echo '[build] 同步表结构'
  npx prisma db push --schema "$PG_SCHEMA" --skip-generate
  if [ "${SEED_ON_DEPLOY:-false}" = "true" ]; then
    echo '[build] 写入种子数据'
    npx prisma db seed --schema "$PG_SCHEMA"
  fi
else
  echo '[build] 警告：DATABASE_URL 未设置，跳过建表与种子数据' >&2
fi

# 裁剪 devDependencies（约 313MB -> 约 100MB），
# 但 npm prune 会连带删除生成的 Prisma Client，先备份再还原
echo '[build] 裁剪开发依赖'
cp -R node_modules/.prisma .prisma-backup
npm prune --omit=dev
rm -rf node_modules/.prisma
cp -R .prisma-backup node_modules/.prisma
rm -rf .prisma-backup

echo '[build] 组装运行时产物到 dist/'
rm -rf dist/node_modules
cp -R node_modules dist/node_modules
rm -rf dist/node_modules/.cache
cp package.json dist/package.json
cp run.sh dist/run.sh
chmod 755 dist/run.sh

echo '[build] 完成'
