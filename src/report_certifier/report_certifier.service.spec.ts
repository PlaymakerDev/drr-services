import { Test, TestingModule } from '@nestjs/testing';
import { ReportCertifierService } from './report_certifier.service';

describe('ReportCertifierService', () => {
  let service: ReportCertifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportCertifierService],
    }).compile();

    service = module.get<ReportCertifierService>(ReportCertifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
