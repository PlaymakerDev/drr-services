import { Test, TestingModule } from '@nestjs/testing';
import { PrefixService } from './prefix.service';

describe('PrefixService', () => {
  let service: PrefixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrefixService],
    }).compile();

    service = module.get<PrefixService>(PrefixService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
