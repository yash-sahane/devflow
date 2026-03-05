import { CreateProjectDto } from '@devflow/shared';
import { ProjectsService } from './projects.service';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
