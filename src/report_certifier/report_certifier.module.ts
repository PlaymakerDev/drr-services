import { Module } from '@nestjs/common';
import { ReportCertifierService } from './report_certifier.service';
import { ReportCertifierController } from './report_certifier.controller';

@Module({
  controllers: [ReportCertifierController],
  providers: [ReportCertifierService],
})
export class ReportCertifierModule {}
