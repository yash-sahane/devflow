import { UserRole } from '../enums/user-role.enum';
import { ProjectRole } from '../enums/project-role.enum';

export const PROJECT_PERMISSIONS = {
  PROJECT_READ: 'project.read',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  MEMBERS_READ: 'members.read',
  MEMBERS_WRITE: 'members.write',
  BUILD_TRIGGER: 'build.trigger',
  LOGS_READ: 'logs.read',
  DEPLOYMENT_READ: 'deployment.read',
  DEPLOYMENT_ROLLBACK: 'deployment.rollback',
} as const;

export type ProjectPermission = (typeof PROJECT_PERMISSIONS)[keyof typeof PROJECT_PERMISSIONS];

export const GLOBAL_ADMIN_ROLE: UserRole = UserRole.ADMIN;

export const PROJECT_PERMISSION_MATRIX: Record<ProjectPermission, readonly ProjectRole[]> = {
  [PROJECT_PERMISSIONS.PROJECT_READ]: [
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.DEVELOPER,
    ProjectRole.VIEWER,
  ],
  [PROJECT_PERMISSIONS.PROJECT_UPDATE]: [ProjectRole.PROJECT_ADMIN],
  [PROJECT_PERMISSIONS.PROJECT_DELETE]: [ProjectRole.PROJECT_ADMIN],
  [PROJECT_PERMISSIONS.MEMBERS_READ]: [ProjectRole.PROJECT_ADMIN],
  [PROJECT_PERMISSIONS.MEMBERS_WRITE]: [ProjectRole.PROJECT_ADMIN],
  [PROJECT_PERMISSIONS.BUILD_TRIGGER]: [ProjectRole.PROJECT_ADMIN, ProjectRole.DEVELOPER],
  [PROJECT_PERMISSIONS.LOGS_READ]: [
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.DEVELOPER,
    ProjectRole.VIEWER,
  ],
  [PROJECT_PERMISSIONS.DEPLOYMENT_READ]: [
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.DEVELOPER,
    ProjectRole.VIEWER,
  ],
  [PROJECT_PERMISSIONS.DEPLOYMENT_ROLLBACK]: [ProjectRole.PROJECT_ADMIN, ProjectRole.DEVELOPER],
};
