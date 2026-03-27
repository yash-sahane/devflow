import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeploymentsService } from './deployments.service';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) { }

  @Get('projects/:projectId/deployments')
  getByProject(@Param('projectId') projectId: string, @CurrentUser() user: { userId: string }) {
    return this.deploymentsService.getDeployments(projectId, user.userId);
  }

  @Get('deployments/:id')
  getById(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.deploymentsService.getDeploymentById(id, user.userId);
  }

  @Post('deployments/:id/rollback')
  rollback(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.deploymentsService.rollback(id, user.userId);
  }
}
