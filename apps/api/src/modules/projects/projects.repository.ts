import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from '@devflow/shared';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: { builds: true },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.project.findFirst({
      where: { id, userId },
      include: { builds: true },
    });
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        repoUrl: dto.repoUrl,
        userId,
      },
    });
  }

  delete(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
