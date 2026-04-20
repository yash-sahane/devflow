import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeploymentsService } from './deployments.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { PROJECT_PERMISSIONS } from '@devflow/shared';
import { RequirePermissions } from '../auth/permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) { }

  @Get('projects/:projectId/deployments')
  @RequirePermissions(PROJECT_PERMISSIONS.DEPLOYMENT_READ)
  getByProject(@Param('projectId') projectId: string) {
    return this.deploymentsService.getDeployments(projectId);
  }

  @Get('deployments/:id')
  @RequirePermissions(PROJECT_PERMISSIONS.DEPLOYMENT_READ)
  getById(@Param('id') id: string) {
    return this.deploymentsService.getDeploymentById(id);
  }

  @Post('deployments/:id/rollback')
  @RequirePermissions(PROJECT_PERMISSIONS.DEPLOYMENT_ROLLBACK)
  rollback(@Param('id') id: string) {
    return this.deploymentsService.rollback(id);
  }
}
