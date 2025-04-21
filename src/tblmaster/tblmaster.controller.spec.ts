import { Test, TestingModule } from '@nestjs/testing';
import { TblmasterController } from './tblmaster.controller';
import { TblmasterService } from './tblmaster.service';

describe('TblmasterController', () => {
  let controller: TblmasterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TblmasterController],
      providers: [TblmasterService],
    }).compile();

    controller = module.get<TblmasterController>(TblmasterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
