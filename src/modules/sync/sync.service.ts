import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SyncMessage } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async findMessages(query: { type?: string; group?: string; status?: string; urgentOnly?: boolean }) {
    const where: Prisma.SyncMessageWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.group) where.group = query.group;
    if (query.status) where.status = query.status;
    if (query.urgentOnly) where.isUrgent = true;
    return this.prisma.syncMessage.findMany({
      where,
      include: {
        issuer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { acks: true } },
      },
      orderBy: [{ isUrgent: 'desc' }, { issuedAt: 'desc' }],
    });
  }

  async getMessage(id: string) {
    const msg = await this.prisma.syncMessage.findUnique({
      where: { id },
      include: {
        issuer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        acks: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!msg) throw new NotFoundException(`同步消息 ${id} 不存在`);
    return msg;
  }

  async publishMessage(data: Omit<SyncMessage, 'id' | 'createdAt'>) {
    return this.prisma.syncMessage.create({ data });
  }

  async updateMessage(id: string, data: Partial<SyncMessage>) {
    await this.getMessage(id);
    return this.prisma.syncMessage.update({ where: { id }, data });
  }

  async readMessage(messageId: string, userId: string) {
    await this.getMessage(messageId);
    const existing = await this.prisma.syncAck.findUnique({
      where: { messageId_userId: { messageId, userId } },
    });
    if (existing) {
      return this.prisma.syncAck.update({
        where: { id: existing.id },
        data: { readAt: new Date() },
      });
    }
    return this.prisma.syncAck.create({
      data: { messageId, userId, readAt: new Date() },
    });
  }

  async confirmMessage(messageId: string, userId: string) {
    await this.getMessage(messageId);
    const existing = await this.prisma.syncAck.findUnique({
      where: { messageId_userId: { messageId, userId } },
    });
    let ack;
    if (existing) {
      ack = await this.prisma.syncAck.update({
        where: { id: existing.id },
        data: { confirmedAt: new Date() },
      });
    } else {
      ack = await this.prisma.syncAck.create({
        data: { messageId, userId, readAt: new Date(), confirmedAt: new Date() },
      });
    }
    const confirmedCount = await this.prisma.syncAck.count({
      where: { messageId, confirmedAt: { not: null } },
    });
    await this.prisma.syncMessage.update({
      where: { id: messageId },
      data: { confirmedCount },
    });
    return ack;
  }

  async getUnconfirmedUsers(messageId: string) {
    const msg = await this.getMessage(messageId);
    let targetIds: string[];
    if (msg.targetUsers) {
      targetIds = JSON.parse(msg.targetUsers) as string[];
    } else {
      const users = await this.prisma.user.findMany({
        where: { group: msg.group, isActive: true },
        select: { id: true },
      });
      targetIds = users.map((u) => u.id);
    }
    const confirmedAcks = await this.prisma.syncAck.findMany({
      where: { messageId, confirmedAt: { not: null } },
      select: { userId: true },
    });
    const confirmedSet = new Set(confirmedAcks.map((a) => a.userId));
    const unconfirmed = targetIds.filter((id) => !confirmedSet.has(id));
    return this.prisma.user.findMany({
      where: { id: { in: unconfirmed } },
      select: { id: true, name: true, email: true, group: true },
    });
  }

  async generateWeeklyReport(week: string) {
    const startDate = this.getWeekStart(week);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const messages = await this.prisma.syncMessage.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
    });
    const byType: Record<string, number> = {};
    const byGroup: Record<string, number> = {};
    let urgentCount = 0;
    for (const m of messages) {
      byType[m.type] = (byType[m.type] || 0) + 1;
      byGroup[m.group] = (byGroup[m.group] || 0) + 1;
      if (m.isUrgent) urgentCount++;
    }
    const summary = `本周共 ${messages.length} 条同步消息，紧急 ${urgentCount} 条`;
    const content = JSON.stringify({ week, startDate, endDate, byType, byGroup, urgentCount, total: messages.length });
    return this.prisma.weeklyReport.upsert({
      where: { generatedWeek: week },
      update: { contentJson: content, summaryText: summary, generatedAt: new Date() },
      create: { generatedWeek: week, contentJson: content, summaryText: summary },
    });
  }

  async subscribe(userId: string, scopeType: string, scopeValue: string) {
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, scopeType, scopeValue },
    });
    if (existing) return existing;
    return this.prisma.subscription.create({ data: { userId, scopeType, scopeValue } });
  }

  async unsubscribe(userId: string, scopeType: string, scopeValue: string) {
    return this.prisma.subscription.deleteMany({ where: { userId, scopeType, scopeValue } });
  }

  async getSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({ where: { userId } });
  }

  private getWeekStart(week: string): Date {
    const [year, w] = week.split('-W').map(Number);
    const jan1 = new Date(year, 0, 1);
    const days = (w - 1) * 7;
    const dayOfWeek = jan1.getDay() || 7;
    return new Date(jan1.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000);
  }
}
