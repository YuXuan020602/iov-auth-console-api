import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SOPService } from './sop.service';
import { SOP, SOPVersion } from '@prisma/client';

@ApiTags('sop')
@Controller('sop')
export class SOPController {
  constructor(private readonly sop: SOPService) {}

  @Get()
  @ApiOperation({ summary: 'SOP 列表' })
  @ApiQuery({ name: 'group', required: false })
  @ApiQuery({ name: 'certType', required: false })
  @ApiQuery({ name: 'vehicle', required: false })
  findAll(
    @Query('group') group?: string,
    @Query('certType') certType?: string,
    @Query('vehicle') vehicle?: string,
  ) {
    return this.sop.findAll({ group, certType, vehicle });
  }

  @Get(':id')
  @ApiOperation({ summary: 'SOP 详情（含所有版本）' })
  findOne(@Param('id') id: string) {
    return this.sop.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建 SOP' })
  create(@Body() data: Omit<SOP, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.sop.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新 SOP 基本信息' })
  update(@Param('id') id: string, @Body() data: Partial<SOP>) {
    return this.sop.update(id, data);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除 SOP（级联删除版本）' })
  remove(@Param('id') id: string) {
    return this.sop.remove(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'SOP 版本列表' })
  findVersions(@Param('id') id: string) {
    return this.sop.findVersions(id);
  }

  @Get('version/:versionId')
  @ApiOperation({ summary: '版本详情（含 body）' })
  getVersion(@Param('versionId') versionId: string) {
    return this.sop.getVersion(versionId);
  }

  @Patch('version/:versionId')
  @ApiOperation({ summary: '更新版本（仅 Draft/Pending 可编辑 body）' })
  updateVersion(
    @Param('versionId') versionId: string,
    @Body() data: Partial<SOPVersion>,
  ) {
    return this.sop.updateVersion(versionId, data);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: '创建新版本（Draft）' })
  createVersion(
    @Param('id') sopId: string,
    @Body() data: Omit<SOPVersion, 'id' | 'createdAt' | 'sopId'>,
  ) {
    return this.sop.createVersion(sopId, data);
  }

  @Post('version/:versionId/submit')
  @ApiOperation({ summary: '提交审批（Draft → Pending）' })
  submitVersion(@Param('versionId') versionId: string) {
    return this.sop.submitVersion(versionId);
  }

  @Post('version/:versionId/approve')
  @ApiOperation({ summary: '审批通过（Pending → Effective，自动归档旧版）' })
  approveVersion(
    @Param('versionId') versionId: string,
    @Body() body: { reviewerId: string },
  ) {
    return this.sop.approveVersion(versionId, body.reviewerId);
  }

  @Post('version/:versionId/reject')
  @ApiOperation({ summary: '驳回（Pending → Draft）' })
  rejectVersion(
    @Param('versionId') versionId: string,
    @Body() body: { reviewerId: string },
  ) {
    return this.sop.rejectVersion(versionId, body.reviewerId);
  }

  @Get('diff/:v1Id/:v2Id')
  @ApiOperation({ summary: '两版本 Diff（简化版）' })
  @ApiParam({ name: 'v1Id' })
  @ApiParam({ name: 'v2Id' })
  diff(@Param('v1Id') v1Id: string, @Param('v2Id') v2Id: string) {
    return this.sop.diffVersions(v1Id, v2Id);
  }
}
