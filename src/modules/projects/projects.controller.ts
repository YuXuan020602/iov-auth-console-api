import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { AuthProject } from '@prisma/client';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '项目列表（支持 group/status/certType 过滤）' })
  @ApiQuery({ name: 'group', required: false, description: 'CP | AA | HiCar' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'certType', required: false })
  findAll(
    @Query('group') group?: string,
    @Query('status') status?: string,
    @Query('certType') certType?: string,
  ) {
    return this.projects.findAll({ group, status, certType });
  }

  @Get(':id')
  @ApiOperation({ summary: '项目详情' })
  findOne(@Param('id') id: string) {
    return this.projects.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  create(@Body() data: Omit<AuthProject, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.projects.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新项目' })
  update(@Param('id') id: string, @Body() data: Partial<AuthProject>) {
    return this.projects.update(id, data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新项目状态（自动触发同步中心预警）' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.projects.updateStatus(id, body.status);
  }
}
