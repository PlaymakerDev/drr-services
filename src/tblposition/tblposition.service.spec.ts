import { Test, TestingModule } from '@nestjs/testing';
import { TblPositionService } from './tblposition.service';

describe('TblpositionService', () => {
  let service: TblPositionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TblPositionService],
    }).compile();

    service = module.get<TblPositionService>(TblPositionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
