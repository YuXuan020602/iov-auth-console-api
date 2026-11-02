#!/bin/bash
# IOV Auth Console API - 阿里云轻量服务器一键部署（与宝塔面板共存）
# 用法: curl -fsSL https://raw.githubusercontent.com/YuXuan020602/iov-auth-console-api/main/scripts/deploy-aliyun.sh | bash
set -e

echo "=== [1/6] 系统依赖 ==="
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y >/dev/null 2>&1
  apt-get install -y git curl xz-utils >/dev/null 2>&1
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y git curl xz >/dev/null 2>&1
elif command -v yum >/dev/null 2>&1; then
  yum install -y git curl xz >/dev/null 2>&1
fi

echo "=== [2/6] 2G swap（1G 内存防编译 OOM）==="
if ! swapon --show=NAME --noheadings 2>/dev/null | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "=== [3/6] Node.js 20（npmmirror 二进制）==="
export PATH=/opt/node/bin:$PATH
if ! node -v 2>/dev/null | grep -q '^v20'; then
  curl -fsSL -o /tmp/node.tar.xz https://registry.npmmirror.com/-/binary/node/v20.18.1/node-v20.18.1-linux-x64.tar.xz
  rm -rf /opt/node && mkdir -p /opt/node
  tar -xJf /tmp/node.tar.xz -C /opt/node --strip-components=1
fi
grep -q '/opt/node/bin' $HOME/.bashrc 2>/dev/null || echo 'export PATH=/opt/node/bin:$PATH' >> $HOME/.bashrc
npm config set registry https://registry.npmmirror.com
node -v && npm -v

echo "=== [4/6] 拉取代码 ==="
if [ ! -d /opt/iov-auth-console-api/.git ]; then
  rm -rf /opt/iov-auth-console-api
  git clone --depth 1 https://github.com/YuXuan020602/iov-auth-console-api.git /opt/iov-auth-console-api
else
  cd /opt/iov-auth-console-api && git pull --ff-only
fi
cd /opt/iov-auth-console-api

echo "=== [5/6] 安装依赖 + Prisma + 编译（1G 内存较慢，请耐心等待）==="
export PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
npm ci --no-audit --no-fund
npx prisma generate --schema=prisma/schema.postgres.prisma
npm run build

echo "=== [6/6] pm2 常驻 ==="
export PATH=/opt/node/bin:$PATH
npm i -g pm2 --no-audit --no-fund >/dev/null 2>&1
if [ -f .env ]; then
  pm2 delete iov-api 2>/dev/null || true
  PORT=8080 NODE_ENV=production pm2 start dist/src/main.js --name iov-api
  pm2 save
  (pm2 startup systemd -u root --hp /root 2>/dev/null | tail -n 1 | bash) || (pm2 startup -u $(whoami) --hp $HOME 2>/dev/null | tail -n 1 | bash) || true
  echo ""
  echo "DONE: API 已启动，端口 8080"
  echo "验证: curl http://127.0.0.1:8080/api/v1/projects"
else
  echo ""
  echo "MISSING_ENV: 未检测到 /opt/iov-auth-console-api/.env"
  echo "请先创建 .env（见部署指引），然后执行:"
  echo "  cd /opt/iov-auth-console-api && PORT=8080 NODE_ENV=production pm2 start dist/src/main.js --name iov-api && pm2 save"
fi
