import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Complaints } from 'src/models/complaints.model';
import { TblDepartment } from 'src/models/department.model';
import { TblMaster } from 'src/models/master.model';
import { TblComplaintsModule } from 'src/tbl_complaints/complaints.module';
import { ComplaintsService } from 'src/tbl_complaints/complaints.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Complaints,
      TblDepartment,
      TblMaster,
    ]),
    TblComplaintsModule,
  ],
  providers: [ReportService, ComplaintsService],
  controllers: [ReportController]
})
export class ReportModule {}
