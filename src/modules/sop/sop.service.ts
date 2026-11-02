import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SOP, SOPVersion } from '@prisma/client';

@Injectable()
export class SOPService {
  constructor(private readonly prisma: PrismaService) {}

  // ====== SOP 主体 ======
  async findAll(query: { group?: string; certType?: string; vehicle?: string }) {
    const where: Prisma.SOPWhereInput = {};
    if (query.group) where.group = query.group;
    if (query.certType) where.certType = query.certType;
    if (query.vehicle) where.vehicle = { contains: query.vehicle };
    return this.prisma.sOP.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sop = await this.prisma.sOP.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!sop) throw new NotFoundException(`SOP ${id} 不存在`);
    return sop;
  }

  async create(data: Omit<SOP, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.sOP.create({ data });
  }

  async update(id: string, data: Partial<SOP>) {
    await this.findOne(id);
    return this.prisma.sOP.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.sOPVersion.deleteMany({ where: { sopId: id } });
    return this.prisma.sOP.delete({ where: { id } });
  }

  // ====== SOPVersion 版本管理 ======
  async findVersions(sopId: string) {
    const sop = await this.prisma.sOP.findUnique({ where: { id: sopId } });
    if (!sop) throw new NotFoundException(`SOP ${sopId} 不存在`);
    return this.prisma.sOPVersion.findMany({
      where: { sopId },
      include: {
        author: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVersion(versionId: string) {
    const version = await this.prisma.sOPVersion.findUnique({
      where: { id: versionId },
      include: {
        sop: true,
        author: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        standardClauses: true,
      },
    });
    if (!version) throw new NotFoundException(`版本 ${versionId} 不存在`);
    return version;
  }

  async updateVersion(versionId: string, data: Partial<SOPVersion>) {
    const version = await this.prisma.sOPVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`版本 ${versionId} 不存在`);
    // 只有 Draft 或 Pending 状态允许编辑 body/changeLog
    if (version.status === 'Effective' || version.status === 'Archived') {
      throw new BadRequestException('生效版/归档版不可直接编辑，请创建新版本');
    }
    return this.prisma.sOPVersion.update({ where: { id: versionId }, data });
  }

  async createVersion(sopId: string, data: Omit<SOPVersion, 'id' | 'createdAt' | 'sopId'>) {
    const sop = await this.prisma.sOP.findUnique({ where: { id: sopId } });
    if (!sop) throw new NotFoundException(`SOP ${sopId} 不存在`);
    return this.prisma.sOPVersion.create({ data: { ...data, sopId } });
  }

  async submitVersion(versionId: string) {
    const version = await this.prisma.sOPVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`版本 ${versionId} 不存在`);
    if (version.status !== 'Draft') {
      throw new BadRequestException('只有 Draft 状态才能提交审批');
    }
    return this.prisma.sOPVersion.update({
      where: { id: versionId },
      data: { status: 'Pending' },
    });
  }

  async approveVersion(versionId: string, reviewerId: string) {
    const version = await this.prisma.sOPVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`版本 ${versionId} 不存在`);
    if (version.status !== 'Pending') {
      throw new BadRequestException('只有 Pending 状态才能审批通过');
    }
    // 归档当前生效版本
    await this.prisma.sOPVersion.updateMany({
      where: { sopId: version.sopId, status: 'Effective' },
      data: { status: 'Archived' },
    });
    // 更新 SOP 当前版本号
    await this.prisma.sOP.update({
      where: { id: version.sopId },
      data: { version: version.versionNo },
    });
    return this.prisma.sOPVersion.update({
      where: { id: versionId },
      data: { status: 'Effective', reviewerId, reviewAt: new Date(), effectiveAt: new Date() },
    });
  }

  async rejectVersion(versionId: string, reviewerId: string) {
    const version = await this.prisma.sOPVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`版本 ${versionId} 不存在`);
    if (version.status !== 'Pending') {
      throw new BadRequestException('只有 Pending 状态才能驳回');
    }
    return this.prisma.sOPVersion.update({
      where: { id: versionId },
      data: { status: 'Draft', reviewerId, reviewAt: new Date() },
    });
  }

  async diffVersions(v1Id: string, v2Id: string) {
    const [v1, v2] = await Promise.all([
      this.prisma.sOPVersion.findUnique({ where: { id: v1Id } }),
      this.prisma.sOPVersion.findUnique({ where: { id: v2Id } }),
    ]);
    if (!v1 || !v2) throw new NotFoundException('版本不存在');
    return {
      v1: { id: v1.id, versionNo: v1.versionNo, body: v1.body },
      v2: { id: v2.id, versionNo: v2.versionNo, body: v2.body },
      stats: {
        v1Length: v1.body.length,
        v2Length: v2.body.length,
        diff: v2.body.length - v1.body.length,
      },
    };
  }
}
