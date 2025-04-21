import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { PageMetaDto } from './page-meta.dto';

export class PageDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;

  @ApiProperty({ type: Boolean })
  readonly success: boolean;

  constructor(data: T[], meta: PageMetaDto) {
    this.success = true;
    this.data = data;
    this.meta = meta;
  }
}
