import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Complaints } from 'src/models/complaints.model';
import { TblMaster } from 'src/models/master.model';
import { TblDepartment } from 'src/models/department.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Complaints, TblMaster, TblDepartment]),
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule {}
