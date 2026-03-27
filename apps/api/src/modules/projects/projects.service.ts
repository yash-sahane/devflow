import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from '@devflow/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) { }

  findAll(userId: string) {
    return this.projectsRepository.findAll(userId);
  }

  async findById(id: string, userId: string) {
    const project = await this.projectsRepository.findByIdForUser(id, userId);
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }
    return project;
  }

  create(dto: CreateProjectDto, userId: string) {
    return this.projectsRepository.create(dto, userId);
  }

  async delete(id: string, userId: string) {
    await this.findById(id, userId); // Ensure the project exists before attempting to delete
    return this.projectsRepository.delete(id);
  }
}
