import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { CreateBuildDto, PROJECT_PERMISSIONS } from '@devflow/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) { }

  @Post('projects/:projectId/builds')
  @RequirePermissions(PROJECT_PERMISSIONS.BUILD_TRIGGER)
  triggerBuild(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBuildDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.buildsService.triggerBuild(projectId, dto, user.userId);
  }

  @Get('builds/:id')
  @RequirePermissions(PROJECT_PERMISSIONS.PROJECT_READ)
  findById(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.buildsService.findById(id, user.userId);
  }

  @Get('builds/:id/logs')
  @RequirePermissions(PROJECT_PERMISSIONS.LOGS_READ)
  findLogs(@Param('id') buildId: string, @CurrentUser() user: { userId: string }) {
    return this.buildsService.findLogs(buildId, user.userId);
  }
}
