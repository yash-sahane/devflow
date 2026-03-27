import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from '@devflow/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) { }

  @Post('projects/:projectId/builds')
  triggerBuild(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBuildDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.buildsService.triggerBuild(projectId, dto, user.userId);
  }

  @Get('builds/:id')
  findById(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.buildsService.findById(id, user.userId);
  }

  @Get('builds/:id/logs')
  findLogs(@Param('id') buildId: string, @CurrentUser() user: { userId: string }) {
    return this.buildsService.findLogs(buildId, user.userId);
  }
}
