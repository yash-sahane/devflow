import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from '@devflow/shared';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findRefById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      select: { id: true }
    })
  }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: { builds: true },
    });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { builds: true },
    });
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: dto.name,
          repoUrl: dto.repoUrl,
        }
      })

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: 'PROJECT_ADMIN',
        }
      })

      return project;
    })
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
