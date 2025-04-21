import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ComplaintsService } from './complaints.service';
import { Complaints } from 'src/models/complaints.model';
import { TblMaster } from 'src/models/master.model';
import { TblDepartment } from 'src/models/department.model';
import { TblComplaintsController } from './complaints.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Complaints, TblMaster, TblDepartment]),
  ],
  controllers: [TblComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService]
})
export class TblComplaintsModule {}
