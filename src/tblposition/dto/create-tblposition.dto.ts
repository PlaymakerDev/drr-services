import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTblpositionDto {
  @ApiProperty({
    description: 'Name of the position',
    example: 'Manager',
    maxLength: 255,
    type: String,
  })
  PName: string;
}

export class EditPositionBody {
  PName: string
}
