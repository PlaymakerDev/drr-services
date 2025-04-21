import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdatedReportCertifierBody {
  @ApiProperty({
      description: 'certificate_name',  
      example: '',              
    })
  @IsString()
  @IsOptional()
  certificate_name?: string;

  @ApiProperty({
    description: 'certificate_role',
    example: '',              
  })
  @IsString()
  @IsOptional()
  certificate_role?: string;
}
