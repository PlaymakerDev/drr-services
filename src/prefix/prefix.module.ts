import { Module } from '@nestjs/common';
import { PrefixService } from './prefix.service';
import { PrefixController } from './prefix.controller';
import { Prefix } from 'src/models/prefix.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forFeature([Prefix]),
  ],
  controllers: [PrefixController],
  providers: [PrefixService],
})
export class PrefixModule {}
