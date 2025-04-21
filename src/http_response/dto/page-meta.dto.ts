import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDtoParameters } from '../../interceptors/interfaces';

export class PageMetaDto {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly page_size: number;

  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly page_count: number;

  @ApiProperty()
  readonly has_previous_page: boolean;

  @ApiProperty()
  readonly has_next_page: boolean;

  constructor({ pageOptionsDto, total }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page;
    this.page_size = pageOptionsDto.page_size;
    this.total = total;
    this.page_count = Math.ceil(this.total / this.page_size);
    this.has_previous_page = this.page > 1;
    this.has_next_page = this.page < this.page_count;
  }
}
