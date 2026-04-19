import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectMembersRespository } from './project-members-respository';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersController } from './project-members.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController, ProjectMembersController],
  providers: [ProjectsService, ProjectsRepository, ProjectMembersRespository, ProjectMembersService],
  exports: [ProjectsService],
})
export class ProjectsModule { }
