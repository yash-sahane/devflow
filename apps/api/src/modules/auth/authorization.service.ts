import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { GLOBAL_ADMIN_ROLE, PROJECT_PERMISSION_MATRIX, PROJECT_PERMISSIONS, ProjectPermission } from "@devflow/shared";

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) { }

  async assertPermission(user: { userId: string, role: string },
    projectId: string,
    permission: ProjectPermission
  ): Promise<void> {
    if (user.role === GLOBAL_ADMIN_ROLE) return;

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId, userId: user.userId
        }
      }
    })

    if (!membership) {
      throw new ForbiddenException('Missing project membership');
    }

    const allowedRoles = PROJECT_PERMISSION_MATRIX[permission];
    if (!allowedRoles.includes(membership.role as any)) {
      throw new ForbiddenException(`Permission denied: ${permission}`);
    }
  }

  async canReadProject(user: { userId: string, role: string }, projectId: string) {
    await this.assertPermission(user, projectId, PROJECT_PERMISSIONS.PROJECT_READ);
  }

  async canManageProject(user: { userId: string; role: string }, projectId: string) {
    await this.assertPermission(user, projectId, PROJECT_PERMISSIONS.PROJECT_UPDATE);
  }

  async canManageMembers(user: { userId: string; role: string }, projectId: string) {
    await this.assertPermission(user, projectId, PROJECT_PERMISSIONS.MEMBERS_WRITE);
  }

  async canTriggerBuild(user: { userId: string; role: string }, projectId: string) {
    await this.assertPermission(user, projectId, PROJECT_PERMISSIONS.BUILD_TRIGGER);
  }

  async canReadLogs(user: { userId: string; role: string }, projectId: string) {
    await this.assertPermission(user, projectId, PROJECT_PERMISSIONS.LOGS_READ);
  }

  async canRollbackDeployment(user: { userId: string; role: string }, projectId: string) {
    await this.assertPermission(user, projectId, PROJECT_PERMISSIONS.DEPLOYMENT_ROLLBACK);
  }
}