import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePrefixDto {
  @ApiProperty({
    description: 'Prefix name',  // คำอธิบายที่จะปรากฏในเอกสาร Swagger
    example: 'Mr.',              // ตัวอย่างข้อมูลที่จะโชว์ใน Swagger UI
  })
  @IsString()  // ตรวจสอบให้เป็น string
  @IsNotEmpty()  // ตรวจสอบให้เป็นค่าว่างไม่ได้
  readonly prefix: string;
}