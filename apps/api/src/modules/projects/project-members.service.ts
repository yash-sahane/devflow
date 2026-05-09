import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectMembersRepository } from './project-members.respository';
import { ProjectRole } from '@devflow/shared';

@Injectable()
export class ProjectMembersService {
  constructor(private readonly membersRepo: ProjectMembersRepository) { }

  async listMembers(projectId: string) {
    await this.assertProjectExists(projectId);
    return this.membersRepo.listByProject(projectId);
  }

  async addMember(projectId: string, userId: string, role: ProjectRole) {
    await this.assertProjectExists(projectId);

    const user = await this.membersRepo.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.membersRepo.findMembership(projectId, userId);
    if (existing) {
      throw new ConflictException('User is already a member of the project');
    }

    return this.membersRepo.createMembership(projectId, userId, role);
  }

  async updateMemberRole(projectId: string, userId: string, nextRole: ProjectRole) {
    await this.assertProjectExists(projectId);

    return this.membersRepo.withTransaction(async (tx) => {
      const membership = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!membership) {
        throw new NotFoundException('Project membership not found');
      }

      if (membership.role === nextRole) {
        throw new BadRequestException('Role is unchanged');
      }

      if (membership.role === 'PROJECT_ADMIN' && nextRole !== 'PROJECT_ADMIN') {
        const adminCount = await this.membersRepo.countProjectAdminsWithTx(tx, projectId);
        if (adminCount <= 1) {
          throw new ForbiddenException('Cannot demote the last PROJECT_ADMIN');
        }
      }

      return this.membersRepo.updateMembershipRoleWithTx(tx, projectId, userId, nextRole);
    });
  }

  async removeMember(projectId: string, userId: string) {
    await this.assertProjectExists(projectId);

    return this.membersRepo.withTransaction(async (tx) => {
      const membership = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!membership) {
        throw new NotFoundException('Project membership not found');
      }

      if (membership.role === 'PROJECT_ADMIN') {
        const adminCount = await this.membersRepo.countProjectAdminsWithTx(tx, projectId);
        if (adminCount <= 1) {
          throw new ForbiddenException('Cannot remove the last PROJECT_ADMIN');
        }
      }

      await this.membersRepo.deleteMembershipWithTx(tx, projectId, userId);
      return { success: true };
    });
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.membersRepo.findProjectById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
