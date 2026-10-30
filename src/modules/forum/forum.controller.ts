import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { ForumPost } from '@prisma/client';

@ApiTags('forum')
@Controller('forum')
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  @Get('posts')
  @ApiOperation({ summary: '帖子列表' })
  @ApiQuery({ name: 'group', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'problemType', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'authorId', required: false })
  findPosts(
    @Query('group') group?: string,
    @Query('status') status?: string,
    @Query('problemType') problemType?: string,
    @Query('keyword') keyword?: string,
    @Query('authorId') authorId?: string,
  ) {
    return this.forum.findPosts({ group, status, problemType, keyword, authorId });
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '帖子详情（含回复）' })
  getPost(@Param('id') id: string) {
    return this.forum.getPost(id);
  }

  @Post('posts')
  @ApiOperation({ summary: '发帖（强制 group/certType/problemType/swVersion 四项元数据）' })
  createPost(
    @Body() data: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favCount' | 'expertScore' | 'status'>,
  ) {
    return this.forum.createPost(data);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: '更新帖子' })
  updatePost(@Param('id') id: string, @Body() data: Partial<ForumPost>) {
    return this.forum.updatePost(id, data);
  }

  @Post('posts/:id/delete')
  @ApiOperation({ summary: '删除帖子' })
  deletePost(@Param('id') id: string) {
    return this.forum.deletePost(id);
  }

  @Post('posts/:id/fav')
  @ApiOperation({ summary: '收藏帖子' })
  favPost(@Param('id') id: string) {
    return this.forum.favPost(id);
  }

  @Post('posts/:id/solve')
  @ApiOperation({ summary: '标记已解决' })
  markSolved(@Param('id') id: string) {
    return this.forum.markSolved(id);
  }

  @Post('posts/:id/close')
  @ApiOperation({ summary: '关闭帖子' })
  close(@Param('id') id: string) {
    return this.forum.close(id);
  }

  @Get('posts/:id/replies')
  @ApiOperation({ summary: '帖子回复列表' })
  getReplies(@Param('id') id: string) {
    return this.forum.getReplies(id);
  }

  @Post('posts/:id/replies')
  @ApiOperation({ summary: '回复帖子' })
  reply(
    @Param('id') postId: string,
    @Body() body: { body: string; authorId: string },
  ) {
    return this.forum.reply(postId, body);
  }

  @Post('posts/:postId/replies/:replyId/best')
  @ApiOperation({ summary: '标记最佳回复（自动清除旧最佳）' })
  markBestReply(
    @Param('postId') postId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.forum.markBestReply(postId, replyId);
  }
}
