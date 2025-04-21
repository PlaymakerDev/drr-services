import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MasterService } from './master.service';
import { MasterController } from './master.controller';
import { MASProvinces } from 'src/models/mas_provinces.model';
import { MASDistrict } from 'src/models/mas_districts.model';
import { MASSubDistricts } from 'src/models/mas_subdistricts.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MASProvinces,
      MASDistrict,
      MASSubDistricts,
    ])
  ],
  providers: [MasterService],
  controllers: [MasterController],
  exports: [MasterService, SequelizeModule],
})
export class MasterModule {}
