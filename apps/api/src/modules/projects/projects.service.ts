import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from '@devflow/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  findAll() {
    return this.projectsRepository.findAll();
  }

  async findById(id: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.projectsRepository.create(dto);
  }

  async delete(id: string) {
    await this.findById(id); // Ensure the project exists before attempting to delete
    return this.projectsRepository.delete(id);
  }
}
