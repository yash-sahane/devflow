import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BuildsRepository } from './builds.repository';
import { ProjectsService } from '../projects/projects.service';
import { CreateBuildDto } from '@devflow/shared';

@Injectable()
export class BuildsService {
  constructor(
    private readonly buildsRepository: BuildsRepository,
    private readonly projectsService: ProjectsService,
    @InjectQueue('builds') private readonly buildsQueue: Queue,
  ) { }

  async triggerBuild(projectId: string, dto: CreateBuildDto, userId: string) {
    // Throws NotFoundException if project doesn't exist
    await this.projectsService.findById(projectId, userId);

    const build = await this.buildsRepository.create(projectId, dto.commitSha);

    await this.buildsQueue.add(
      'run-build',
      {
        buildId: build.id,
        projectId,
        commitSha: dto.commitSha,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return { buildId: build.id, status: build.status };
  }

  async findById(id: string, userId: string) {
    const build = await this.buildsRepository.findByIdForUser(id, userId);
    if (!build) {
      throw new NotFoundException(`Build ${id} not found`);
    }
    return build;
  }

  async findLogs(buildId: string, userId: string) {
    const build = await this.buildsRepository.findByIdForUser(buildId, userId);
    if (!build) {
      throw new NotFoundException(`Build ${buildId} not found`);
    }

    return this.buildsRepository.findLogs(buildId);
  }
}
