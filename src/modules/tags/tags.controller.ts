import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  // ====== Tag 维度管理 ======
  @Get()
  @ApiOperation({ summary: '标签列表（按 dimension 过滤）' })
  @ApiQuery({ name: 'dimension', required: false })
  findTags(@Query('dimension') dimension?: string) {
    return this.tags.findTags({ dimension });
  }

  @Post()
  @ApiOperation({ summary: '创建标签（dimension + value 唯一）' })
  createTag(
    @Body() body: { dimension: string; value: string; createdBy: string },
  ) {
    return this.tags.createTag(body.dimension, body.value, body.createdBy);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签（级联清除桥表）' })
  deleteTag(@Param('id') id: string) {
    return this.tags.deleteTag(id);
  }

  // ====== EntityTag 桥表 ======
  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: '获取实体的所有标签' })
  getEntityTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.tags.getEntityTags(entityType, entityId);
  }

  @Post('entity/:entityType/:entityId')
  @ApiOperation({ summary: '给实体添加标签' })
  addEntityTag(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { tagId: string },
  ) {
    return this.tags.addEntityTag(entityType, entityId, body.tagId);
  }

  @Delete('entity/:entityType/:entityId/:tagId')
  @ApiOperation({ summary: '移除实体标签' })
  removeEntityTag(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tags.removeEntityTag(entityType, entityId, tagId);
  }

  @Put('entity/:entityType/:entityId')
  @ApiOperation({ summary: '批量设置实体标签（先清后建）' })
  setEntityTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { tagIds: string[] },
  ) {
    return this.tags.setEntityTags(entityType, entityId, body.tagIds);
  }

  @Post('query/entities')
  @ApiOperation({ summary: '根据标签反查实体 ID 列表' })
  findEntitiesByTags(
    @Body() body: { entityType: string; tagIds: string[] },
  ) {
    return this.tags.findEntitiesByTags(body.entityType, body.tagIds);
  }
}
