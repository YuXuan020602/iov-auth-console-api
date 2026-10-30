import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Tag, EntityTag } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  // ====== Tag 维度管理 ======
  async findTags(query: { dimension?: string }) {
    const where: Prisma.TagWhereInput = {};
    if (query.dimension) where.dimension = query.dimension;
    return this.prisma.tag.findMany({
      where,
      orderBy: [{ dimension: 'asc' }, { value: 'asc' }],
    });
  }

  async getTag(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException(`标签 ${id} 不存在`);
    return tag;
  }

  async createTag(dimension: string, value: string, createdBy: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { dimension_value: { dimension, value } },
    });
    if (existing) throw new ConflictException(`标签 ${dimension}:${value} 已存在`);
    return this.prisma.tag.create({ data: { dimension, value, createdBy } });
  }

  async deleteTag(id: string) {
    const tag = await this.getTag(id);
    // 级联删除桥表
    await this.prisma.entityTag.deleteMany({ where: { tagId: id } });
    return this.prisma.tag.delete({ where: { id } });
  }

  // ====== EntityTag 桥表 ======
  async getEntityTags(entityType: string, entityId: string) {
    return this.prisma.entityTag.findMany({
      where: { entityType, entityId },
      include: { tag: true },
    });
  }

  async addEntityTag(entityType: string, entityId: string, tagId: string) {
    // 验证 tag 存在
    await this.getTag(tagId);
    const existing = await this.prisma.entityTag.findUnique({
      where: { tagId_entityType_entityId: { tagId, entityType, entityId } },
    });
    if (existing) return existing;
    return this.prisma.entityTag.create({ data: { entityType, entityId, tagId } });
  }

  async removeEntityTag(entityType: string, entityId: string, tagId: string) {
    return this.prisma.entityTag.deleteMany({
      where: { entityType, entityId, tagId },
    });
  }

  // 批量设置（先清后建）
  async setEntityTags(entityType: string, entityId: string, tagIds: string[]) {
    await this.prisma.entityTag.deleteMany({ where: { entityType, entityId } });
    if (tagIds.length === 0) return [];
    return this.prisma.entityTag.createMany({
      data: tagIds.map((tagId) => ({ entityType, entityId, tagId })),
    });
  }

  // 根据标签反查实体
  async findEntitiesByTags(entityType: string, tagIds: string[]) {
    const entityTags = await this.prisma.entityTag.findMany({
      where: { entityType, tagId: { in: tagIds } },
      select: { entityId: true },
      distinct: ['entityId'],
    });
    return entityTags.map((et) => et.entityId);
  }
}
