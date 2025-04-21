import { Module } from '@nestjs/common';
import { TblmasterService } from './tblmaster.service';
import { TblmasterController } from './tblmaster.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { TblMaster } from 'src/models/master.model';

@Module({
  imports: [
    SequelizeModule.forFeature([TblMaster]),
  ],
  controllers: [TblmasterController],
  providers: [TblmasterService],
})
export class TblmasterModule {}