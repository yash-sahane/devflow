import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BuildsRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(projectId: string, commitSha: string) {
    return this.prisma.build.create({
      data: {
        projectId,
        commitSha,
        status: 'QUEUED',
      },
    });
  }

  findById(id: string) {
    return this.prisma.build.findUnique({
      where: { id },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.build.findFirst({
      where: {
        id,
        project: {
          members: { some: { userId } },
        },
      },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.build.update({
      where: { id },
      data: { status },
    });
  }

  addLog(buildId: string, message: string) {
    return this.prisma.buildLog.create({
      data: { buildId, message },
    });
  }

  findLogs(buildId: string) {
    return this.prisma.buildLog.findMany({
      where: { buildId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
