import { CreateProjectDto, UpdateProjectDto, PROJECT_PERMISSIONS } from '@devflow/shared';
import { ProjectsService } from './projects.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.projectsService.findAll(user.userId);
  }

  @Get(':id')
  @RequirePermissions(PROJECT_PERMISSIONS.PROJECT_READ)
  findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: { userId: string }) {
    return this.projectsService.create(dto, user.userId);
  }

  @Patch(':id')
  @RequirePermissions(PROJECT_PERMISSIONS.PROJECT_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PROJECT_PERMISSIONS.PROJECT_DELETE)
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
