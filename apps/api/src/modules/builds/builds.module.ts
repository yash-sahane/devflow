import { Module } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { BuildsController } from './builds.controller';
import { BuildsRepository } from './builds.repository';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../../database/prisma.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [PrismaModule, QueueModule, ProjectsModule],
  providers: [BuildsService, BuildsRepository],
  controllers: [BuildsController],
})
export class BuildsModule {}
