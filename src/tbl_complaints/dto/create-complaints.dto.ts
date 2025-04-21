import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDate, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateTblComplaintDto {
  @IsString()
  @IsNotEmpty()
  source_type: string;

  @IsOptional()
  @IsDate()
  date_received?: Date;

  @IsBoolean()
  anonymous: boolean;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  phone_number: string;

  @IsOptional()
  additional_contact: string;

  @IsString()
  category_type: string;

  @IsString()
  complaint_type: string;

  @IsString()
  province: string;

  @IsString()
  district: string;

  @IsString()
  sub_district: string;

  @IsString()
  road: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  area: string;

  @IsOptional()
  attachment_received1: string;

  @IsOptional()
  attachment_received2: string;

  @IsOptional()
  attachment_received3: string;

  @IsOptional()
  attachment_received4: string;

  @IsOptional()
  attachment_received5: string;

  @IsString()
  notified_office: string;

  @IsString()
  document: string;

  @IsOptional()
  @IsDate()
  date_closed?: Date;

  @IsString()
  explanation_result: string;

  @IsOptional()
  attachment_closed1: string;

  @IsOptional()
  attachment_closed2: string;

  @IsOptional()
  attachment_closed3: string;

  @IsOptional()
  attachment_closed4: string;

  @IsOptional()
  attachment_closed5: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsDate()
  receive_at?: Date;

  @IsOptional()
  @IsDate()
  progress_at?: Date;

  @IsOptional()
  @IsDate()
  terminate_at?: Date;

  @IsOptional()
  @IsDate()
  created_at?: Date;

  @IsString()
  created_by: string;

  @IsOptional()
  @IsDate()
  updated_at?: Date;

  @IsString()
  updated_by: string;
  
  @IsOptional()
  @IsDate()
  deleted_at?: Date;
  
  @IsOptional()
  deleted_by: string;

  @IsString()
  complaint_other: string;

  @IsString()
  sub_notified_office: string;
}

export class Querybody {
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  category_type?: string;

  @IsOptional()
  @IsString()
  complaint_type?: string;
  
  @IsOptional()
  @IsString()
  notified_office?: string;

  @IsOptional()
  @IsString()
  status?: string;
  
  @IsOptional()
  @IsString()
  source_type?: string;

}

export class BodyFiles {
  type: string
}

export class QueryComplaint {
  dept_typts: string;
  notified_office: string;
  sub_notified_office: string;
}
