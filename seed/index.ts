/**
 * Seed script for IOV Auth Console
 * Populates dev.db with mock data matching frontend mock.ts
 *
 * Run: npx prisma db seed  OR  npm run seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding IOV Auth Console...');

  // ====== 清理旧数据 ======
  await prisma.syncAck.deleteMany();
  await prisma.syncMessage.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.entityTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.knowledge.deleteMany();
  await prisma.standardClause.deleteMany();
  await prisma.sOPVersion.deleteMany();
  await prisma.sOP.deleteMany();
  await prisma.authProject.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleaned old data');

  // ====== 用户 ======
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: '张工程师',
        email: 'zhang@iov.cp',
        passwordHash: bcrypt.hashSync('123456', 10),
        group: 'CP',
        role: 'Engineer',
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        name: '李主管',
        email: 'li@iov.cp',
        passwordHash: bcrypt.hashSync('123456', 10),
        group: 'CP',
        role: 'Leader',
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        name: '王工-AA组',
        email: 'wang@iov.aa',
        passwordHash: bcrypt.hashSync('123456', 10),
        group: 'AA',
        role: 'Engineer',
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        name: '赵工-HiCar',
        email: 'zhao@iov.hicar',
        passwordHash: bcrypt.hashSync('123456', 10),
        group: 'HiCar',
        role: 'Engineer',
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        name: '新同学',
        email: 'newbie@iov.cp',
        passwordHash: bcrypt.hashSync('123456', 10),
        group: 'CP',
        role: 'Newbie',
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        name: '外部顾问',
        email: 'external@partner.com',
        passwordHash: bcrypt.hashSync('123456', 10),
        group: 'CP',
        role: 'External',
        externalAccount: true,
        externalMaxLevel: 'L2',
        externalProjects: JSON.stringify(['proj_001']),
        avatar: null,
      },
    }),
  ]);
  console.log(`  ✓ Created ${users.length} users`);

  const [zhang, li, wang, zhao, newbie, external] = users;

  // ====== 标签 ======
  const tags = await Promise.all([
    prisma.tag.createMany({
      data: [
        { dimension: 'CertType', value: 'CCC', createdBy: li.id },
        { dimension: 'CertType', value: '3C', createdBy: li.id },
        { dimension: 'CertType', value: 'HiCar', createdBy: li.id },
        { dimension: 'ProblemDomain', value: '蓝牙', createdBy: li.id },
        { dimension: 'ProblemDomain', value: 'WiFi', createdBy: li.id },
        { dimension: 'ProblemDomain', value: 'USB', createdBy: li.id },
        { dimension: 'VehicleSw', value: 'Android 12', createdBy: li.id },
        { dimension: 'VehicleSw', value: 'Android 13', createdBy: li.id },
        { dimension: 'SecretLevel', value: 'L1', createdBy: li.id },
        { dimension: 'SecretLevel', value: 'L2', createdBy: li.id },
      ],

    }),
  ]);
  console.log(`  ✓ Created tags`);

  // ====== 项目 ======
  const projects = await Promise.all([
    prisma.authProject.create({
      data: {
        name: '智行车机 V2.0 CCC 认证',
        group: 'CP',
        certType: 'CCC',
        vehiclePlatform: 'Android',
        swVersion: '13.0',
        region: '中国',
        status: 'Certifying',
        ownerId: zhang.id,
        startDate: new Date('2026-08-01'),
        milestone: '证书下发',
        secretLevel: 'L1',
        sopCount: 3,
        openIssues: 2,
      },
    }),
    prisma.authProject.create({
      data: {
        name: 'AA 助手 3C 认证',
        group: 'AA',
        certType: '3C',
        vehiclePlatform: 'Linux',
        swVersion: '5.15',
        region: '欧盟',
        status: 'Passed',
        ownerId: wang.id,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-09-15'),
        secretLevel: 'L2',
        sopCount: 5,
        openIssues: 0,
      },
    }),
    prisma.authProject.create({
      data: {
        name: 'HiCar 套件 V4 适配',
        group: 'HiCar',
        certType: 'HiCar',
        vehiclePlatform: 'HarmonyOS',
        swVersion: '4.0',
        region: '中国',
        status: 'Ongoing',
        ownerId: zhao.id,
        startDate: new Date('2026-10-01'),
        secretLevel: 'L1',
        sopCount: 2,
        openIssues: 5,
      },
    }),
    prisma.authProject.create({
      data: {
        name: '蓝牙 5.3 CCC 差异验证',
        group: 'CP',
        certType: 'CCC',
        vehiclePlatform: 'Android',
        swVersion: '14.0',
        region: '中国',
        status: 'Planning',
        ownerId: li.id,
        startDate: new Date('2026-12-01'),
        secretLevel: 'L1',
        sopCount: 0,
        openIssues: 0,
      },
    }),
    prisma.authProject.create({
      data: {
        name: '旧项目 Blocked Case',
        group: 'CP',
        certType: 'CCC',
        vehiclePlatform: 'Android',
        swVersion: '11.0',
        region: '中国',
        status: 'Blocked',
        ownerId: zhang.id,
        startDate: new Date('2025-06-01'),
        secretLevel: 'L2',
        sopCount: 1,
        openIssues: 12,
      },
    }),
    prisma.authProject.create({
      data: {
        name: '认证失败案例-Terminated',
        group: 'AA',
        certType: '3C',
        vehiclePlatform: 'Linux',
        swVersion: '5.10',
        region: '欧盟',
        status: 'Terminated',
        ownerId: wang.id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-08-01'),
        secretLevel: 'L1',
        sopCount: 2,
        openIssues: 8,
      },
    }),
  ]);
  console.log(`  ✓ Created ${projects.length} projects`);

  // ====== SOP + SOPVersion ======
  const sop1 = await prisma.sOP.create({
    data: {
      sopNo: 'SOP-CP-CCC-001',
      title: 'CP 组 CCC 认证通用流程',
      group: 'CP',
      certType: 'CCC',
      vehicle: 'Android 车机',
      version: 'v2.1',
      ownerId: li.id,
      secretLevel: 'L1',
    },
  });
  const sop1v1 = await prisma.sOPVersion.create({
    data: {
      sopId: sop1.id,
      authorId: li.id,
      versionNo: 'v2.1',
      body: '# CP 组 CCC 认证 SOP v2.1\n\n## 1. 准备阶段\n- 收集车辆信息表\n- 确认测试设备型号\n\n## 2. 测试阶段\n- 执行 RF 测试用例 1-50\n- 记录 DUT 日志\n\n## 3. 报告阶段\n- 整理测试数据\n- 提交 TCF 报告',
      changeLog: 'v2.1: 增加了 WiFi 6E 测试项目，更新了设备清单',
      status: 'Effective',
      reviewerId: zhang.id,
      reviewAt: new Date('2026-07-01'),
      effectiveAt: new Date('2026-07-15'),
    },
  });

  const sop2 = await prisma.sOP.create({
    data: {
      sopNo: 'SOP-AA-3C-002',
      title: 'AA 组 3C 认证蓝牙测试流程',
      group: 'AA',
      certType: '3C',
      vehicle: 'Linux 车机',
      version: 'v1.0',
      ownerId: wang.id,
      secretLevel: 'L1',
    },
  });
  const sop2v1 = await prisma.sOPVersion.create({
    data: {
      sopId: sop2.id,
      authorId: wang.id,
      versionNo: 'v1.0',
      body: '# AA 组 3C 蓝牙测试 SOP v1.0\n\n## 1. 环境配置\n- 屏蔽室校准\n- 参考天线连接\n\n## 2. 测试用例\n- BR/EDR 功率测试\n- BLE 测试\n- 杂散辐射测试',
      status: 'Effective',
      reviewerId: zhao.id,
      reviewAt: new Date('2026-04-01'),
      effectiveAt: new Date('2026-04-15'),
    },
  });

  const sop3 = await prisma.sOP.create({
    data: {
      sopNo: 'SOP-HiCar-003',
      title: 'HiCar 套件适配 SOP',
      group: 'HiCar',
      certType: 'HiCar',
      vehicle: 'HarmonyOS 车机',
      version: 'v0.3',
      ownerId: zhao.id,
      secretLevel: 'L1',
    },
  });
  const sop3v1 = await prisma.sOPVersion.create({
    data: {
      sopId: sop3.id,
      authorId: zhao.id,
      versionNo: 'v0.3',
      body: '# HiCar 适配 SOP v0.3\n\n## 待完善\n\n- [ ] 连接稳定性\n- [ ] 音频延迟\n- [ ] 跨设备切换',
      status: 'Draft',
    },
  });

  console.log(`  ✓ Created ${3} SOPs with versions`);

  // ====== 知识库 ======
  const knowledges = await Promise.all([
    prisma.knowledge.create({
      data: {
        title: '蓝牙 RF 测试踩坑总结',
        category: '踩坑总结',
        group: 'CP',
        body: '## 问题背景\nAndroid 13 上蓝牙 5.2 CCC 测试经常出现灵敏度余量不足\n\n## 根因分析\n1. 天线匹配网络在低温下偏移\n2. 基带芯片固件 bug (MTK v5.10)\n\n## 解决方案\n- 固件升级到 v5.11.2\n- 天线调谐至 -20dBm @ 2.4GHz',
        ownerId: zhang.id,
        reviewDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'Valid',
        secretLevel: 'L1',
        refCount: 23,
        favCount: 8,
        summary: 'Android 13 蓝牙 RF 测试常见问题及修复方案',
      },
    }),
    prisma.knowledge.create({
      data: {
        title: '抓包方法大全',
        category: '抓包方法',
        group: 'AA',
        body: '## 一、Android\nadb shell dumpsys bluetooth_manager\n\n## 二、Linux\nbtmon -w capture.log\nwireshark 打开\n\n## 三、注意事项\n- 确保开启 HCI snoop log\n- 关闭蓝牙省电模式',
        ownerId: wang.id,
        reviewDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'PendingReview',
        secretLevel: 'L1',
        refCount: 45,
        favCount: 12,
        summary: 'Android/Linux 车机蓝牙抓包步骤详解',
      },
    }),
    prisma.knowledge.create({
      data: {
        title: 'HiCar 与 Android Auto 认证差异',
        category: '认证差异',
        group: 'HiCar',
        body: '## 概览\nHiCar 套件认证 vs Google AA 认证差异点\n\n## 主要差异\n| 项目 | HiCar | AA |\n|------|-------|----|\n| 测试标准 | 华为内部 | USB-IF |\n| 连接方式 | HUAWEI Link | USB / BT |\n| 音频延迟 | ≤50ms | ≤100ms |',
        ownerId: zhao.id,
        reviewDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'Valid',
        secretLevel: 'L2',
        refCount: 15,
        favCount: 3,
        summary: '两大主流车机系统认证差异对比表',
      },
    }),
    prisma.knowledge.create({
      data: {
        title: 'Log 分析技巧',
        category: 'Log 分析',
        group: 'CP',
        body: '## 关键词 grep\nsync\nconnect\npair\nscan\n\n## 常见错误码\nE_BT_SCAN_FAILED (101): 扫描失败\nE_BT_CONN_FAILED (102): 连接失败',
        ownerId: li.id,
        reviewDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 已过期
        status: 'PendingReview',
        secretLevel: 'L1',
        refCount: 67,
        favCount: 20,
        summary: '车机蓝牙 log 常用 grep 命令',
      },
    }),
    prisma.knowledge.create({
      data: {
        title: 'CCC vs CCC 差异表',
        category: '认证差异',
        group: 'CP',
        body: '## 两者差异\n...',
        ownerId: zhang.id,
        reviewDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'Archived',
        secretLevel: 'L1',
        refCount: 5,
        favCount: 0,
        summary: '已归档的旧知识',
      },
    }),
    prisma.knowledge.create({
      data: {
        title: '术语表',
        category: '术语表',
        group: 'CP',
        body: '| 术语 | 全称 | 说明 |\n|------|------|------|\n| DUT | Device Under Test | 被测设备 |\n| TCF | Test Case File | 测试用例文件 |\n| TRD | Test Report Data | 测试报告数据 |',
        ownerId: li.id,
        reviewDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'Valid',
        secretLevel: 'L1',
        refCount: 100,
        favCount: 15,
        summary: '认证领域常用术语中英对照表',
      },
    }),
    prisma.knowledge.create({
      data: {
        title: 'FAQ 汇总',
        category: 'FAQ',
        group: 'AA',
        body: '## Q: 为什么 RF 测试过不了？\nA: 检查天线匹配，常见是馈线松动。\n\n## Q: 如何导出测试日志？\nA: 使用 Android Studio Profiler。',
        ownerId: wang.id,
        reviewDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'Valid',
        secretLevel: 'L1',
        refCount: 30,
        favCount: 6,
        summary: '认证流程高频问题解答',
      },
    }),
  ]);
  console.log(`  ✓ Created ${knowledges.length} knowledge entries`);

  // ====== 论坛帖子 ======
  const post1 = await prisma.forumPost.create({
    data: {
      title: 'Android 14 蓝牙测试一直挂，求指导！',
      group: 'CP',
      certType: 'CCC',
      problemType: 'FuncError',
      swVersion: '14.0',
      body: '最近做 Android 14 CCC 认证，蓝牙 RF 灵敏度测试一直不过，比标准值差 3~5dBm 左右。测试机是 MTK 平台，有没有大佬遇到过类似问题？\n\n已尝试：\n1. 固件升级到最新\n2. 换了三台 DUT 都是一样\n3. 屏蔽室校准确认没问题',
      authorId: newbie.id,
      projectId: projects[0].id,
      status: 'Discussing',
      viewCount: 156,
      favCount: 8,
      expertScore: 0,
    },
  });
  const post1r1 = await prisma.forumReply.create({
    data: {
      postId: post1.id,
      body: 'Android 14 引入了蓝牙省电模式 BAP，会影响 RF 灵敏度。试试关闭蓝牙低功耗模式：\n\nadb shell settings put global ble_scan_always_enabled 1\nadb shell dumpsys bluetooth_manager | grep -i power',
      authorId: zhang.id,
      isBest: true,
    },
  });
  await prisma.forumPost.update({ where: { id: post1.id }, data: { bestReplyId: post1r1.id, status: 'Solved', expertScore: 10 } });

  const post2 = await prisma.forumPost.create({
    data: {
      title: 'USB 3.0 与蓝牙共存干扰问题',
      group: 'AA',
      certType: '3C',
      problemType: 'Connection',
      swVersion: '5.15',
      body: 'USB 3.0 开启后蓝牙连接频繁断连，有没有通用的规避方案？',
      authorId: wang.id,
      projectId: projects[1].id,
      status: 'Solved',
      viewCount: 89,
      favCount: 12,
      expertScore: 20,
    },
  });

  const post3 = await prisma.forumPost.create({
    data: {
      title: 'HiCar 连接延迟优化',
      group: 'HiCar',
      certType: 'HiCar',
      problemType: 'CertFail',
      swVersion: '4.0',
      body: 'HiCar 套件测试中音频延迟始终在 80ms 左右，标准要求 ≤50ms，怎么调？',
      authorId: zhao.id,
      projectId: projects[2].id,
      status: 'Discussing',
      viewCount: 45,
      favCount: 3,
      expertScore: 0,
    },
  });

  const post4 = await prisma.forumPost.create({
    data: {
      title: '新手求教：TCF 报告怎么写？',
      group: 'CP',
      certType: 'CCC',
      problemType: 'Toolchain',
      swVersion: '13.0',
      body: '刚入职，要写 CCC 认证的 TCF 报告，请问有没有模板或参考？',
      authorId: newbie.id,
      status: 'Discussing',
      viewCount: 23,
      favCount: 1,
      expertScore: 0,
    },
  });

  const post5 = await prisma.forumPost.create({
    data: {
      title: '标准解读：RF 测试到底测什么？',
      group: 'CP',
      certType: 'CCC',
      problemType: 'StdInterp',
      swVersion: '13.0',
      body: '新人求科普，CCC 里 RF 测试项有哪些？为什么要测这些？',
      authorId: newbie.id,
      status: 'Closed',
      viewCount: 78,
      favCount: 5,
      expertScore: 0,
    },
  });

  const post6 = await prisma.forumPost.create({
    data: {
      title: '测试通过啦！分享一下踩的坑',
      group: 'AA',
      certType: '3C',
      problemType: 'FuncError',
      swVersion: '5.15',
      body: '终于过了！写了一篇踩坑总结，稍后转成知识库分享给大家。',
      authorId: wang.id,
      projectId: projects[1].id,
      status: 'Converted',
      viewCount: 200,
      favCount: 25,
      expertScore: 30,
    },
  });

  console.log(`  ✓ Created 6 forum posts with replies`);

  // ====== 同步消息 ======
  const syncMsgs = await Promise.all([
    prisma.syncMessage.create({
      data: {
        type: 'StdChange',
        title: 'CCC 认证标准 2026 版更新发布',
        body: '最新 CCC 认证标准更新了 RF 测试用例，新增 WiFi 7E 测试项。影响所有 CP 组项目。',
        group: 'CP',
        issuerId: li.id,
        status: 'Published',
        confirmedCount: 8,
        totalCount: 12,
        isUrgent: true,
        issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.syncMessage.create({
      data: {
        type: 'SOPUpdate',
        title: 'SOP-CP-CCC-001 v2.1 已生效',
        body: '新版本增加了 WiFi 6E 测试项目，请相关项目负责人查阅。',
        group: 'CP',
        issuerId: li.id,
        status: 'Published',
        confirmedCount: 5,
        totalCount: 12,
        isUrgent: false,
        issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.syncMessage.create({
      data: {
        type: 'ProjectBlock',
        title: '旧项目已 Blocked',
        body: '项目「旧项目 Blocked Case」因多次测试不通过已被 Blocked。',
        group: 'CP',
        issuerId: zhang.id,
        projectId: projects[4].id,
        status: 'Published',
        confirmedCount: 12,
        totalCount: 12,
        isUrgent: true,
        issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.syncMessage.create({
      data: {
        type: 'CertFailure',
        title: 'AA 组某项目认证失败',
        body: '「认证失败案例-Terminated」项目因合规问题终止。',
        group: 'AA',
        issuerId: wang.id,
        projectId: projects[5].id,
        status: 'Published',
        confirmedCount: 6,
        totalCount: 8,
        isUrgent: false,
        issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.syncMessage.create({
      data: {
        type: 'KnowledgeReview',
        title: '2 条知识库即将到期复审',
        body: 'Log 分析技巧、CCC vs CCC 差异表 需本周内复审。',
        group: 'CP',
        issuerId: li.id,
        status: 'Published',
        confirmedCount: 3,
        totalCount: 12,
        isUrgent: false,
        issuedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`  ✓ Created ${syncMsgs.length} sync messages`);

  // ====== ACK 示例 ======
  await prisma.syncAck.createMany({
    data: [
      { messageId: syncMsgs[0].id, userId: zhang.id, readAt: new Date(), confirmedAt: new Date() },
      { messageId: syncMsgs[0].id, userId: li.id, readAt: new Date(), confirmedAt: new Date() },
      { messageId: syncMsgs[0].id, userId: wang.id, readAt: new Date() },
      { messageId: syncMsgs[2].id, userId: zhang.id, readAt: new Date(), confirmedAt: new Date() },
    ],
  });
  console.log(`  ✓ Created sync ACKs`);

  // ====== 订阅示例 ======
  await prisma.subscription.createMany({
    data: [
      { userId: zhang.id, scopeType: 'certType', scopeValue: 'CCC' },
      { userId: zhang.id, scopeType: 'messageType', scopeValue: 'StdChange' },
      { userId: wang.id, scopeType: 'certType', scopeValue: '3C' },
      { userId: zhao.id, scopeType: 'group', scopeValue: 'HiCar' },
    ],
  });
  console.log(`  ✓ Created subscriptions`);

  console.log('\n✅ Seed complete!');
  console.log(`   登录: zhang@iov.cp / 123456`);
  console.log(`        li@iov.cp / 123456`);
  console.log(`        wang@iov.aa / 123456`);
  console.log(`        zhao@iov.hicar / 123456`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
