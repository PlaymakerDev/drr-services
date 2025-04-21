import { Module } from '@nestjs/common';
import { TblPositionService } from './tblposition.service';
import { TblpositionController } from './tblposition.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { TblPosition } from 'src/models/position.model';

@Module({
  imports: [
    SequelizeModule.forFeature([TblPosition]),
  ],
  controllers: [TblpositionController],
  providers: [TblPositionService],
})
export class TblpositionModule {}
