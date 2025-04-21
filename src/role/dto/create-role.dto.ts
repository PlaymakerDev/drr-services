import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',  
    example: 'Staff',            
  })
  @IsString()
  @IsNotEmpty()
  readonly role: string;
}