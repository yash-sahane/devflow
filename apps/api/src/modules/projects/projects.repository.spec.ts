import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsRepository } from './projects.repository';

describe('ProjectsRepository', () => {
  let provider: ProjectsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsRepository],
    }).compile();

    provider = module.get<ProjectsRepository>(ProjectsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
