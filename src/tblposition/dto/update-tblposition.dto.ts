import { PartialType } from '@nestjs/swagger';
import { CreateTblpositionDto } from './create-tblposition.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTblpositionDto extends PartialType(CreateTblpositionDto) {
  @ApiProperty({ description: 'PName', required: false })
  PName?: string;
}