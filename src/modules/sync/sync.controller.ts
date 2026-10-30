import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncMessage } from '@prisma/client';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Get('messages')
  @ApiOperation({ summary: '同步消息列表' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'group', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'urgentOnly', required: false, type: Boolean })
  findMessages(
    @Query('type') type?: string,
    @Query('group') group?: string,
    @Query('status') status?: string,
    @Query('urgentOnly') urgentOnly?: string,
  ) {
    return this.sync.findMessages({ type, group, status, urgentOnly: urgentOnly === 'true' });
  }

  @Get('messages/:id')
  @ApiOperation({ summary: '同步消息详情（含 ACK 列表）' })
  getMessage(@Param('id') id: string) {
    return this.sync.getMessage(id);
  }

  @Post('messages')
  @ApiOperation({ summary: '发布同步消息' })
  publishMessage(@Body() data: Omit<SyncMessage, 'id' | 'createdAt'>) {
    return this.sync.publishMessage(data);
  }

  @Patch('messages/:id')
  @ApiOperation({ summary: '更新同步消息' })
  updateMessage(@Param('id') id: string, @Body() data: Partial<SyncMessage>) {
    return this.sync.updateMessage(id, data);
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: '标记已读' })
  readMessage(@Param('id') messageId: string, @Body() body: { userId: string }) {
    return this.sync.readMessage(messageId, body.userId);
  }

  @Post('messages/:id/confirm')
  @ApiOperation({ summary: '确认同步' })
  confirmMessage(@Param('id') messageId: string, @Body() body: { userId: string }) {
    return this.sync.confirmMessage(messageId, body.userId);
  }

  @Get('messages/:id/unconfirmed')
  @ApiOperation({ summary: '未确认名单' })
  getUnconfirmedUsers(@Param('id') messageId: string) {
    return this.sync.getUnconfirmedUsers(messageId);
  }

  @Post('weekly-report/:week')
  @ApiOperation({ summary: '生成周报汇总（week: YYYY-Www）' })
  generateWeeklyReport(@Param('week') week: string) {
    return this.sync.generateWeeklyReport(week);
  }

  @Get('subscriptions/:userId')
  @ApiOperation({ summary: '查询用户订阅' })
  getSubscriptions(@Param('userId') userId: string) {
    return this.sync.getSubscriptions(userId);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: '订阅' })
  subscribe(@Body() body: { userId: string; scopeType: string; scopeValue: string }) {
    return this.sync.subscribe(body.userId, body.scopeType, body.scopeValue);
  }

  @Post('subscriptions/unsubscribe')
  @ApiOperation({ summary: '取消订阅' })
  unsubscribe(@Body() body: { userId: string; scopeType: string; scopeValue: string }) {
    return this.sync.unsubscribe(body.userId, body.scopeType, body.scopeValue);
  }
}
