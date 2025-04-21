/* eslint-disable prettier/prettier */
import { HttpException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseOK<Data> {
  constructor(data: Data) {
    this.success = true;
    this.response = data;
  }

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'The response api' })
  response: Data;
}

export class ResponseError extends HttpException {
  constructor(
    http_status: number, error_code: string, error_messages?: string[],
    external_error?: any
  ) {
    super(
      {
        status_code: http_status,
        error_code: error_code,
        errors: error_messages,
        external_error: external_error,
      },
      http_status,
    );

    this.statusCode = http_status;
    this.error_code = error_code;
    this.errors = error_messages;
    this.externalError = external_error;
  }

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ description: 'The code error' })
  error_code: string;

  @ApiProperty({ description: 'The many message error' })
  errors: string[];

  @ApiProperty({ description: 'The external error' })
  externalError: object;
}

export class ResponseSavedType {
  @ApiProperty({
    description: 'The id returning on save',
    example: '1, 2, 3',
  })
  id: string;

  @ApiProperty({ description: 'Message', example: 'Save data successfully.' })
  message: string;
}

export class ResponseSaved extends ResponseOK<ResponseSavedType> {
  constructor(id: string) {
    super({
      id: id,
      message: 'Save data successfully.',
    });
  }
  @ApiProperty({ type: ResponseSavedType })
  response: ResponseSavedType;
}

export class ResponseOKIndex {
  page: number;
  page_size: number;
  total: number;
}

export class ResponsePaginationMeta {
  constructor(total: number, page: number, pageSize: number) {
    this.page = page;
    this.total = total;
    this.page_size = pageSize;
    const pageCount = Math.ceil(total / pageSize);
    this.page_count = pageCount;
    this.has_previous_page = page > 1 ? true : false;
    this.has_next_page = page < pageCount ? true : false;
  }
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  page_size: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 2 })
  page_count: number;

  @ApiProperty({ example: true })
  has_previous_page: boolean;

  @ApiProperty({ example: true })
  has_next_page: boolean

}

export class ResponsePagination<T> {
  @ApiProperty({ type: <T>[], isArray: true })
  data: T[]; // data

  @ApiProperty({ example: 100 })
  total: number; // item count

  @ApiProperty({ example: 1 })
  page: number; // current page

  @ApiProperty({ example: 20 })
  page_size: number; // alias limit

  meta: ResponsePaginationMeta;
}

export class ResponseSuccess<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'The response Data' })
  data: T;

  constructor(data: T) {
    this.data = data;
    this.success = true
  }

}

