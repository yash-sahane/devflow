import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ProjectContextService {
  constructor(private readonly prisma: PrismaService) { }

  async resolveProjectId(params: Record<string, string>): Promise<string | null> {
    if (params.projectId) return params.projectId;

    if (params.id && params.id.length > 0) {
      const build = await this.prisma.build.findUnique({
        where: { id: params.id },
        include: { project: true }
      })

      if (build) return build.projectId;

      const deployment = await this.prisma.deployment.findUnique({
        where: { id: params.id },
        include: { build: { include: { project: true } } }
      })

      if (deployment?.build.projectId) return deployment.build.projectId;
    }

    return null;
  }
}