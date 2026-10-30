import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Knowledge } from '@prisma/client';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { group?: string; category?: string; status?: string; keyword?: string }) {
    const where: Prisma.KnowledgeWhereInput = {};
    if (query.group) where.group = query.group;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { body: { contains: query.keyword } },
        { summary: { contains: query.keyword } },
      ];
    }
    return this.prisma.knowledge.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const k = await this.prisma.knowledge.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        projects: { select: { id: true, name: true } },
        convertedFromPost: { select: { id: true, title: true } },
      },
    });
    if (!k) throw new NotFoundException(`知识库 ${id} 不存在`);
    await this.prisma.knowledge.update({ where: { id }, data: { refCount: { increment: 1 } } });
    return k;
  }

  async create(data: Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt' | 'refCount' | 'favCount'>) {
    return this.prisma.knowledge.create({ data });
  }

  async update(id: string, data: Partial<Knowledge>) {
    await this.findOne(id);
    return this.prisma.knowledge.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.knowledge.delete({ where: { id } });
  }

  async fav(id: string) {
    await this.findOne(id);
    return this.prisma.knowledge.update({
      where: { id },
      data: { favCount: { increment: 1 } },
    });
  }

  async convertFromPost(postId: string, ownerId: string) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`帖子 ${postId} 不存在`);

    let answerBody = '';
    if (post.bestReplyId) {
      const reply = await this.prisma.forumReply.findUnique({ where: { id: post.bestReplyId } });
      answerBody = reply?.body || '';
    }

    const kb = await this.prisma.knowledge.create({
      data: {
        title: `[转] ${post.title}`,
        category: 'FAQ',
        group: post.group,
        body: `${post.body}\n\n---\n\n**最佳答案**\n\n${answerBody}`,
        ownerId,
        reviewDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        convertedFromPostId: postId,
        sourceUrl: post.id,
        summary: post.body.slice(0, 120),
      },
    });

    await this.prisma.forumPost.update({
      where: { id: postId },
      data: { status: 'Converted' },
    });

    return kb;
  }

  async markPendingReview() {
    const now = new Date();
    return this.prisma.knowledge.updateMany({
      where: { status: 'Valid', reviewDue: { lte: now } },
      data: { status: 'PendingReview' },
    });
  }

  async confirmValid(id: string, extendDays = 180) {
    await this.findOne(id);
    return this.prisma.knowledge.update({
      where: { id },
      data: {
        status: 'Valid',
        reviewDue: new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.knowledge.update({ where: { id }, data: { status: 'Archived' } });
  }
}
