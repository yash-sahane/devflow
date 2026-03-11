import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Job } from 'bullmq';

@Processor('builds')
@Injectable()
export class BuildProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async process(job: Job<{ buildId: string, commitSha: string }>) {
    const { buildId, commitSha } = job.data;

    // 1. Mark RUNNING
    await this.prisma.build.update({ where: { id: buildId }, data: { status: 'RUNNING' } });

    try {
      // 2. Simulate build work
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Store log line
      await this.prisma.buildLog.create({ data: { buildId, message: `Build ${buildId} for commit ${commitSha} completed successfully.` } });

      // 4. Mark SUCCESS
      await this.prisma.build.update({ where: { id: buildId }, data: { status: 'SUCCESS' } });
    } catch {
      await this.prisma.build.update({ where: { id: buildId }, data: { status: 'FAILED' } })
    }
  }
}
