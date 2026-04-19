import { Module } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsRepository } from './deployments.repository';
import { PrismaModule } from '../../database/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ProjectsModule, AuthModule],
  providers: [DeploymentsService, DeploymentsRepository],
  controllers: [DeploymentsController],
  exports: [DeploymentsService],
})
export class DeploymentsModule { }
