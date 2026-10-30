// 校验两份 Prisma schema 的模型定义是否一致
// 本地开发用 prisma/schema.prisma（SQLite），云端用 prisma/schema.postgres.prisma（Postgres）。
// Prisma 不支持单文件按环境切换 provider，因此模型部分必须手工保持同步。
//
// 用法：node scripts/check-schema-sync.mjs（或在 npm run schema:check）
// 退出码：0 = 一致；1 = 存在差异。

import fs from 'node:fs';
import path from 'node:path';

const SQLITE_SCHEMA = 'prisma/schema.prisma';
const POSTGRES_SCHEMA = 'prisma/schema.postgres.prisma';

// 只取 model 段落，忽略 datasource / generator 与空行、整行注释，
// 并折叠多余空白（两个文件的字段对齐列宽不同，不应算差异）
function extractModels(file) {
  const text = fs.readFileSync(path.resolve(file), 'utf8');
  const start = text.search(/^\s*model\s+/m);
  if (start === -1) throw new Error(`${file} 中未找到 model 定义`);

  return text
    .slice(start)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && !line.startsWith('//'));
}

const a = extractModels(SQLITE_SCHEMA);
const b = extractModels(POSTGRES_SCHEMA);

const max = Math.max(a.length, b.length);
const diffs = [];
for (let i = 0; i < max; i += 1) {
  if (a[i] !== b[i]) {
    diffs.push({ line: i + 1, sqlite: a[i] ?? '(缺失)', postgres: b[i] ?? '(缺失)' });
  }
}

if (diffs.length === 0) {
  console.log(`✓ 两份 schema 的模型定义一致（${a.length} 行，来自 ${SQLITE_SCHEMA} 与 ${POSTGRES_SCHEMA}）`);
  process.exit(0);
}

console.error(`✗ 检测到 ${diffs.length} 处模型定义差异，请同步两份 schema：`);
for (const d of diffs.slice(0, 20)) {
  console.error(`  第 ${d.line} 行`);
  console.error(`    ${SQLITE_SCHEMA}: ${d.sqlite}`);
  console.error(`    ${POSTGRES_SCHEMA}: ${d.postgres}`);
}
if (diffs.length > 20) console.error(`  ...另有 ${diffs.length - 20} 处差异未显示`);
process.exit(1);
