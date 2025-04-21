import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Complaints } from 'src/models/complaints.model';
import { TblDepartment } from 'src/models/department.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Complaints,
      TblDepartment,
    ])
  ],
  providers: [DashboardService],
  controllers: [DashboardController]
})
export class DashboardModule {}
