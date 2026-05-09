import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@devflow/shared';
import { Prisma, ProjectMemberRole } from '@prisma/client';

@Injectable()
export class ProjectMembersRepository {
  constructor(private readonly prisma: PrismaService) { }

  findProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  }

  listByProject(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            globalRole: true,
          },
        },
      },
    });
  }

  findMembership(projectId: string, userId: string) {
    return this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        }
      }
    })
  }

  createMembership(projectId: string, userId: string, role: ProjectRole) {
    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      }
    })
  }

  updateMembershipRoleWithTx(
    tx: Prisma.TransactionClient,
    projectId: string,
    userId: string,
    role: ProjectRole,
  ) {
    return tx.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
    });
  }

  deleteMembershipWithTx(
    tx: Prisma.TransactionClient,
    projectId: string,
    userId: string,
  ) {
    return tx.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  countProjectAdminsWithTx(tx: Prisma.TransactionClient, projectId: string) {
    return tx.projectMember.count({
      where: {
        projectId,
        role: ProjectMemberRole.PROJECT_ADMIN,
      },
    });
  }

  async withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction((tx) => fn(tx));
  }
}
