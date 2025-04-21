import { PartialType } from '@nestjs/swagger';
import { CreateTblComplaintDto } from './create-complaints.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTblComplaintDto extends PartialType(CreateTblComplaintDto) {
  @ApiProperty({ description: 'Source type', required: false })
  source_type?: string;

  @ApiProperty({ description: 'Date received', required: false })
  date_received?: Date;

  @ApiProperty({ description: 'Is anonymous', required: false })
  anonymous?: boolean;

  @ApiProperty({ description: 'First name', required: false })
  first_name?: string;

  @ApiProperty({ description: 'Last name', required: false })
  last_name?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  phone_number?: string;

  @ApiProperty({ description: 'Additional contact', required: false })
  additional_contact?: string;

  @ApiProperty({ description: 'Category type', required: false })
  category_type?: string;

  @ApiProperty({ description: 'Complaint type', required: false })
  complaint_type?: string;

  @ApiProperty({ description: 'Province', required: false })
  province?: string;

  @ApiProperty({ description: 'District', required: false })
  district?: string;

  @ApiProperty({ description: 'Sub-district', required: false })
  sub_district?: string;

  @ApiProperty({ description: 'Road', required: false })
  road?: string;

  @ApiProperty({ description: 'Latitude', required: false })
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  longitude?: number;

  @ApiProperty({ description: 'Area', required: false })
  area?: string;

  @ApiProperty({ description: 'Document', required: false })
  document?: string;

  @ApiProperty({ description: 'attachment_received1', required: false })
  attachment_received1?: string;

  @ApiProperty({ description: 'attachment_received2', required: false })
  attachment_received2?: string;

  @ApiProperty({ description: 'attachment_received3', required: false })
  attachment_received3?: string;

  @ApiProperty({ description: 'attachment_received4', required: false })
  attachment_received4?: string;

  @ApiProperty({ description: 'attachment_received5', required: false })
  attachment_received5?: string;

  @ApiProperty({ description: 'Date closed', required: false })
  date_closed?: Date;

  @ApiProperty({ description: 'Explanation result', required: false })
  explanation_result?: string;
  
  @ApiProperty({ description: 'attachment_closed1', required: false })
  attachment_closed1: string;

  @ApiProperty({ description: 'attachment_closed2', required: false })
  attachment_closed2: string;

  @ApiProperty({ description: 'attachment_closed3', required: false })
  attachment_closed3: string;

  @ApiProperty({ description: 'attachment_closed4', required: false })
  attachment_closed4: string;

  @ApiProperty({ description: 'attachment_closed5', required: false })
  attachment_closed5: string;

  @ApiProperty({ description: 'Status', required: false })
  status?: string;

  @ApiProperty({ description: 'Receive at', required: false })
  receive_at?: Date;

  @ApiProperty({ description: 'Progress at', required: false })
  progress_at?: Date;

  @ApiProperty({ description: 'Terminate at', required: false })
  terminate_at?: Date;

  @ApiProperty({ description: 'Created by', required: false })
  created_by?: string;

  @ApiProperty({ description: 'Updated by', required: false })
  updated_by?: string;

  @ApiProperty({ description: 'Notified office', required: false })
  notified_office?: string;
}
