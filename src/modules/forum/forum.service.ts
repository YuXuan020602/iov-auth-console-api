import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ForumPost, ForumReply } from '@prisma/client';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async findPosts(query: {
    group?: string;
    status?: string;
    problemType?: string;
    keyword?: string;
    authorId?: string;
  }) {
    const where: Prisma.ForumPostWhereInput = {};
    if (query.group) where.group = query.group;
    if (query.status) where.status = query.status;
    if (query.problemType) where.problemType = query.problemType;
    if (query.authorId) where.authorId = query.authorId;
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { body: { contains: query.keyword } },
      ];
    }
    return this.prisma.forumPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPost(id: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        replies: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { isBest: 'desc' },
        },
      },
    });
    if (!post) throw new NotFoundException(`帖子 ${id} 不存在`);
    await this.prisma.forumPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return post;
  }

  async createPost(data: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favCount' | 'expertScore' | 'status'>) {
    if (!data.group || !data.certType || !data.problemType || !data.swVersion) {
      throw new BadRequestException('发帖必须填写 group / certType / problemType / swVersion 四项元数据');
    }
    const similar = await this.prisma.forumPost.findMany({
      where: {
        certType: data.certType,
        problemType: data.problemType,
        status: { in: ['Discussing', 'Solved'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const SIMILARITY_THRESHOLD = 0.6;
    const similarPosts = similar.filter((p) => {
      const overlap = this.jaccardSimilarity(p.title.toLowerCase(), data.title.toLowerCase());
      return overlap > SIMILARITY_THRESHOLD;
    });

    const post = await this.prisma.forumPost.create({ data: { ...data, status: 'Discussing' } });
    return { post, similarPosts: similarPosts.slice(0, 3) };
  }

  async updatePost(id: string, data: Partial<ForumPost>) {
    await this.getPost(id);
    return this.prisma.forumPost.update({ where: { id }, data });
  }

  async deletePost(id: string) {
    await this.getPost(id);
    await this.prisma.forumReply.deleteMany({ where: { postId: id } });
    return this.prisma.forumPost.delete({ where: { id } });
  }

  async favPost(id: string) {
    await this.getPost(id);
    return this.prisma.forumPost.update({ where: { id }, data: { favCount: { increment: 1 } } });
  }

  async markSolved(id: string) {
    await this.getPost(id);
    return this.prisma.forumPost.update({ where: { id }, data: { status: 'Solved' } });
  }

  async close(id: string) {
    await this.getPost(id);
    return this.prisma.forumPost.update({ where: { id }, data: { status: 'Closed' } });
  }

  async getReplies(postId: string) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`帖子 ${postId} 不存在`);
    return this.prisma.forumReply.findMany({
      where: { postId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: [{ isBest: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async reply(postId: string, data: Omit<ForumReply, 'id' | 'createdAt' | 'postId' | 'isBest'>) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`帖子 ${postId} 不存在`);
    if (post.status === 'Closed') throw new BadRequestException('帖子已关闭，不能回复');
    return this.prisma.forumReply.create({ data: { ...data, postId, isBest: false } });
  }

  async markBestReply(postId: string, replyId: string) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`帖子 ${postId} 不存在`);
    const reply = await this.prisma.forumReply.findUnique({ where: { id: replyId } });
    if (!reply || reply.postId !== postId) {
      throw new NotFoundException(`回复 ${replyId} 不属于该帖子`);
    }
    await this.prisma.forumReply.updateMany({
      where: { postId, isBest: true },
      data: { isBest: false },
    });
    await this.prisma.forumReply.update({ where: { id: replyId }, data: { isBest: true } });
    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        bestReplyId: replyId,
        expertScore: { increment: 10 },
      },
    });
  }

  private jaccardSimilarity(a: string, b: string): number {
    const sa = new Set(a.split(''));
    const sb = new Set(b.split(''));
    const intersection = [...sa].filter((x) => sb.has(x)).length;
    const union = new Set([...sa, ...sb]).size;
    return union === 0 ? 0 : intersection / union;
  }
}
