import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from '@devflow/shared';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      include: { builds: true },
    });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { builds: true },
    });
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        repoUrl: dto.repoUrl,
      },
    });
  }

  delete(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
