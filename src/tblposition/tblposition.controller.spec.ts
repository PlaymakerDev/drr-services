import { Test, TestingModule } from '@nestjs/testing';
import { TblpositionController } from './tblposition.controller';
import { TblpositionService } from './tblposition.service';

describe('TblpositionController', () => {
  let controller: TblpositionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TblpositionController],
      providers: [TblpositionService],
    }).compile();

    controller = module.get<TblpositionController>(TblpositionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
