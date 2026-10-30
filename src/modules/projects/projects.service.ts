import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AuthProject } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { group?: string; status?: string; certType?: string }) {
    const where: Prisma.AuthProjectWhereInput = {};
    if (query.group) where.group = query.group;
    if (query.status) where.status = query.status;
    if (query.certType) where.certType = query.certType;
    return this.prisma.authProject.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.authProject.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true } }, sops: true, forumPosts: true },
    });
    if (!project) throw new NotFoundException(`项目 ${id} 不存在`);
    return project;
  }

  async create(data: Omit<AuthProject, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.authProject.create({ data });
  }

  async update(id: string, data: Partial<AuthProject>) {
    await this.findOne(id);
    return this.prisma.authProject.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: string) {
    const project = await this.update(id, { status });
    if (status === 'Blocked' || status === 'CertifyingFailed') {
      // 自动触发同步中心预警（简化：直接写一条 SyncMessage）
      await this.prisma.syncMessage.create({
        data: {
          type: status === 'Blocked' ? 'ProjectBlock' : 'CertFailure',
          title: `${project.name} 状态变更为 ${status}`,
          group: project.group,
          issuerId: project.ownerId,
          projectId: id,
          status: 'Published',
          totalCount: 5,
          confirmedCount: 0,
          isUrgent: true,
        },
      });
    }
    return project;
  }
}
