import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto } from '@devflow/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) { }

  async assertProjectExists(id: string): Promise<void> {
    const project = await this.projectsRepository.findRefById(id);
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }
  }

  findAll(userId: string) {
    return this.projectsRepository.findAll(userId);
  }

  async findById(id: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.projectsRepository.create(dto, userId);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findById(id);
    return this.projectsRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.projectsRepository.delete(id);
  }
}
