import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { PrismaModule } from './database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './modules/projects/projects.module';
import { BuildsModule } from './modules/builds/builds.module';
import { QueueModule } from './modules/queue/queue.module';
import { InternalModule } from './modules/internal/internal.module';
import { AuthModule } from './modules/auth/auth.module';
import { LogsModule } from './modules/logs/logs.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';

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
    AuthModule,
    LogsModule,
    DeploymentsModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule { }
