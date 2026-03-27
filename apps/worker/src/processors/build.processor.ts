import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Job } from 'bullmq';
import Redis from 'ioredis';

type BuildJobData = {
  buildId: string;
  projectId: string;
  commitSha: string;
};

@Processor('builds')
@Injectable()
export class BuildProcessor extends WorkerHost {
  private readonly logger = new Logger(BuildProcessor.name);
  private readonly redisPublisher: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.redisPublisher = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async process(job: Job<BuildJobData>) {
    const { buildId, commitSha } = job.data;

    await this.prisma.build.update({
      where: { id: buildId },
      data: { status: 'RUNNING' },
    });

    try {
      await this.emitLog(buildId, `Build started for commit ${commitSha}`);
      await this.emitStep(buildId, 'Cloning repository...', 500);
      await this.emitStep(buildId, 'Installing dependencies...', 1000);
      await this.emitStep(buildId, 'Running build command...', 1500);

      await this.prisma.build.update({
        where: { id: buildId },
        data: { status: 'SUCCESS' },
      });

      await this.createDeploymentForBuild(buildId);

      await this.emitLog(buildId, 'Build complete.', 'SUCCESS');
    } catch (error) {
      await this.prisma.build.update({
        where: { id: buildId },
        data: { status: 'FAILED' },
      });

      const message =
        error instanceof Error ? `Build failed: ${error.message}` : 'Build failed';
      await this.emitLog(buildId, message, 'FAILED');

      // Important: rethrow so BullMQ retries according to attempts/backoff.
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BuildJobData> | undefined, error: Error) {
    const buildId = job?.data?.buildId ?? 'unknown';
    this.logger.error(
      `Job failed jobId=${job?.id ?? 'unknown'} buildId=${buildId} attemptsMade=${job?.attemptsMade ?? 0}: ${error.message}`,
      error.stack,
    );
  }

  private async emitStep(buildId: string, message: string, delayMs: number) {
    await this.emitLog(buildId, message);
    await this.sleep(delayMs);
  }

  private async emitLog(buildId: string, message: string, status?: 'SUCCESS' | 'FAILED') {
    const timestamp = new Date().toISOString();

    await this.prisma.buildLog.create({
      data: { buildId, message },
    });

    await this.redisPublisher.publish(
      `build-logs:${buildId}`,
      JSON.stringify({
        message,
        timestamp,
        status,
      }),
    );
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async createDeploymentForBuild(buildId: string) {
    const build = await this.prisma.build.findUnique({
      where: { id: buildId },
    });
    if (!build) return null;

    const url = `pr-${buildId}.devflow.local`;

    return this.prisma.$transaction(async (tx) => {
      await tx.deployment.updateMany({
        where: { build: { projectId: build.projectId } },
        data: { isActive: false },
      });

      return tx.deployment.create({
        data: {
          buildId,
          url,
          isActive: true,
        },
      });
    });
  }
}
