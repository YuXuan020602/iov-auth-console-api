import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { Knowledge } from '@prisma/client';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: '知识库列表' })
  @ApiQuery({ name: 'group', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  findAll(
    @Query('group') group?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.knowledge.findAll({ group, category, status, keyword });
  }

  @Get(':id')
  @ApiOperation({ summary: '知识库详情' })
  findOne(@Param('id') id: string) {
    return this.knowledge.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建知识库' })
  create(
    @Body() data: Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt' | 'refCount' | 'favCount'>,
  ) {
    return this.knowledge.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新知识库' })
  update(@Param('id') id: string, @Body() data: Partial<Knowledge>) {
    return this.knowledge.update(id, data);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除知识库' })
  remove(@Param('id') id: string) {
    return this.knowledge.remove(id);
  }

  @Post(':id/fav')
  @ApiOperation({ summary: '收藏（favCount+1）' })
  fav(@Param('id') id: string) {
    return this.knowledge.fav(id);
  }

  @Post(':id/confirm-valid')
  @ApiOperation({ summary: '复审通过，续期' })
  confirmValid(
    @Param('id') id: string,
    @Body() body?: { extendDays?: number },
  ) {
    return this.knowledge.confirmValid(id, body?.extendDays || 180);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档' })
  archive(@Param('id') id: string) {
    return this.knowledge.archive(id);
  }

  @Post('convert/:postId')
  @ApiOperation({ summary: '从论坛帖子一键转知识库' })
  convertFromPost(
    @Param('postId') postId: string,
    @Body() body: { ownerId: string },
  ) {
    return this.knowledge.convertFromPost(postId, body.ownerId);
  }

  @Post('maintenance/mark-pending')
  @ApiOperation({ summary: '维护：将复审到期的知识标记为 PendingReview' })
  markPendingReview() {
    return this.knowledge.markPendingReview();
  }
}
