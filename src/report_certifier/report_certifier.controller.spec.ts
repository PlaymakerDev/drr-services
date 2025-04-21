import { Test, TestingModule } from '@nestjs/testing';
import { ReportCertifierController } from './report_certifier.controller';
import { ReportCertifierService } from './report_certifier.service';

describe('ReportCertifierController', () => {
  let controller: ReportCertifierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCertifierController],
      providers: [ReportCertifierService],
    }).compile();

    controller = module.get<ReportCertifierController>(ReportCertifierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
