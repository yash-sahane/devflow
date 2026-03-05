import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { PrismaModule } from './database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './modules/projects/projects.module';
import { BuildsModule } from './modules/builds/builds.module';
import { QueueModule } from './modules/queue/queue.module';
import { InternalModule } from './modules/internal/internal.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProjectsModule,
    BuildsModule,
    QueueModule,
    InternalModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
