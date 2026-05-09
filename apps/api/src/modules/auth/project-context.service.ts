import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ProjectContextService {
  constructor(private readonly prisma: PrismaService) { }

  async resolveProjectId(params: Record<string, string>): Promise<string | null> {
    if (params.projectId) return params.projectId;

    if (params.id && params.id.length > 0) {
      // Project route context: /projects/:id
      const project = await this.prisma.project.findUnique({
        where: { id: params.id },
        select: { id: true },
      });
      if (project) return project.id;

      // Build route context: /builds/:id
      const build = await this.prisma.build.findUnique({
        where: { id: params.id },
        select: { projectId: true },
      });
      if (build) return build.projectId;

      // Deployment route context: /deployments/:id
      const deployment = await this.prisma.deployment.findUnique({
        where: { id: params.id },
        select: { build: { select: { projectId: true } } },
      });
      if (deployment?.build?.projectId) return deployment.build.projectId;
    }

    return null;
  }
}