import { IsEnum } from 'class-validator';
import { ProjectRole } from '../enums/project-role.enum';

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}