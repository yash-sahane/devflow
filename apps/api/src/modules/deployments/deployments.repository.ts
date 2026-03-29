import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DeploymentsRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(buildId: string, url: string, isActive: boolean = false) {
    return this.prisma.deployment.create({
      data: { buildId, url, isActive }
    })
  }

  setActive(deploymentId: string, projectId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.deployment.updateMany({
        where: { build: { projectId } },
        data: { isActive: false }
      })

      return tx.deployment.update({
        where: { id: deploymentId },
        data: { isActive: true },
        include: { build: true }
      })
    })
  }

  findAllByProject(projectId: string) {
    return this.prisma.deployment.findMany({
      where: { build: { projectId } },
      include: { build: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  findById(id: string) {
    return this.prisma.deployment.findUnique({
      where: { id },
      include: { build: true }
    })
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.deployment.findFirst({
      where: {
        id,
        build: {
          project: {
            members: { some: { userId } },
          }
        }
      },
      include: { build: true }
    })
  }
}
