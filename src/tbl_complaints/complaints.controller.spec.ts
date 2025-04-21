import { Test, TestingModule } from '@nestjs/testing';
import { TblComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

describe('TblComplaintsController', () => {
  let controller: TblComplaintsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TblComplaintsController],
      providers: [ComplaintsService],
    }).compile();

    controller = module.get<TblComplaintsController>(TblComplaintsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
