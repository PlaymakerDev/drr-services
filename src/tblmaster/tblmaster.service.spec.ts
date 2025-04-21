import { Test, TestingModule } from '@nestjs/testing';
import { TblmasterService } from './tblmaster.service';

describe('TblmasterService', () => {
  let service: TblmasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TblmasterService],
    }).compile();

    service = module.get<TblmasterService>(TblmasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
