import { Test, TestingModule } from '@nestjs/testing';
import { PrefixController } from './prefix.controller';
import { PrefixService } from './prefix.service';

describe('PrefixController', () => {
  let controller: PrefixController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrefixController],
      providers: [PrefixService],
    }).compile();

    controller = module.get<PrefixController>(PrefixController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
