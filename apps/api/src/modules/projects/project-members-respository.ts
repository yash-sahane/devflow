import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProjectRole } from '@devflow/shared';

@Injectable()
export class ProjectMembersRespository {
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

  updateMembershipRole(projectId: string, userId: string, role: ProjectRole) {
    return this.prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        }
      },
      data: { role }
    })
  }

  deleteMembership(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        }
      }
    })
  }

  countProjectAdmins(projectId: string) {
    return this.prisma.projectMember.count({
      where: { projectId, role: 'PROJECT_ADMIN' }
    })
  }

  async withTransaction<T>(fn: (tx: PrismaService) => Promise<T>) {
    return this.prisma.$transaction(async () => fn(this.prisma));
  }
}
