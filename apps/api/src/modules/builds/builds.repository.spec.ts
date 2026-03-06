import { Test, TestingModule } from '@nestjs/testing';
import { BuildsRepository } from './builds.repository';

describe('BuildsRepository', () => {
  let provider: BuildsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuildsRepository],
    }).compile();

    provider = module.get<BuildsRepository>(BuildsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
