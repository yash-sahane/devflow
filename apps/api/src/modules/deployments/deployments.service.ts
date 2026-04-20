
import { Injectable, NotFoundException } from '@nestjs/common';
import { DeploymentsRepository } from './deployments.repository';
import { PrismaService } from '../../database/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class DeploymentsService {
  constructor(
    private readonly deploymentsRepository: DeploymentsRepository,
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) { }

  async createDeployment(buildId: string) {
    const build = await this.prisma.build.findUnique({
      where: { id: buildId },
      include: { project: true }
    })

    if (!build) {
      throw new NotFoundException(`Build not found`);
    }

    const url = `pr-${buildId}.devflow.local`;
    const deployment = await this.deploymentsRepository.create(buildId, url, false);

    return this.deploymentsRepository.setActive(deployment.id, build.projectId);
  }

  async rollback(deploymentId: string) {
    const deployment = await this.deploymentsRepository.findById(deploymentId);
    if (!deployment) {
      throw new NotFoundException(`Deployment not found`);
    }

    return this.deploymentsRepository.setActive(deploymentId, deployment.build.projectId);
  }

  async getDeploymentById(id: string) {
    const deployment = await this.deploymentsRepository.findById(id);
    if (!deployment) {
      throw new NotFoundException(`Deployment not found`);
    }
    return deployment;
  }

  async getDeployments(projectId: string) {
    await this.projectsService.assertProjectExists(projectId);
    return this.deploymentsRepository.findAllByProject(projectId);
  }
}
