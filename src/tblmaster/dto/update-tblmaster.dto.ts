import { PartialType } from '@nestjs/swagger';
import { CreateTblmasterDto } from './create-tblmaster.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTblmasterDto {
  @IsNotEmpty()
  @IsString()
  mas_name: string;

}