import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from '@devflow/shared';

@Controller()
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Post('projects/:projectId/builds')
  triggerBuild(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBuildDto,
  ) {
    return this.buildsService.triggerBuild(projectId, dto);
  }

  @Get('builds/:id')
  findById(@Param('id') id: string) {
    return this.buildsService.findById(id);
  }

  @Get('builds/:id/logs')
  findLogs(@Param('id') buildId: string) {
    return this.buildsService.findLogs(buildId);
  }
}
