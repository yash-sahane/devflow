import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectMembersService } from './project-members.service';
import { RequirePermissions } from '../auth/permission.decorator';
import { PROJECT_PERMISSIONS } from '@devflow/shared';
import { AddProjectMemberDto } from '@devflow/shared/dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from '@devflow/shared/dto/update-project-member-role.dto';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) { }

  @Get()
  @RequirePermissions(PROJECT_PERMISSIONS.MEMBERS_READ)
  list(@Param('projectId') projectId: string) {
    return this.membersService.listMembers(projectId);
  }

  @Post()
  @RequirePermissions(PROJECT_PERMISSIONS.MEMBERS_WRITE)
  add(@Param('projectId') projectId: string, @Body() dto: AddProjectMemberDto) {
    return this.membersService.addMember(projectId, dto.userId, dto.role);
  }

  @Patch(':userId')
  @RequirePermissions(PROJECT_PERMISSIONS.MEMBERS_WRITE)
  updateRole(@Param('projectId') projectId: string, @Param('userId') userId: string, @Body() dto: UpdateProjectMemberRoleDto) {
    return this.membersService.updateMemberRole(projectId, userId, dto.role);
  }

  @Delete(':userId')
  @RequirePermissions(PROJECT_PERMISSIONS.MEMBERS_WRITE)
  remove(@Param('projectId') projectId: string, @Param('userId') userId: string) {
    return this.membersService.removeMember(projectId, userId);
  }
}