import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MasterService } from './master.service';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from 'src/guards/roles.decorator';

@ApiTags('Master Data')
@UseGuards(RolesGuard)
@Controller({
  version: '1',
  path: 'master',
})
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  @ApiQuery({
    required: false,
    description: "For text search like name, id etc.",
    name: "textSearch",
  })
  @ApiQuery({
    required: false,
    description: "",
    name: "id",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("provinces")
  getProvinces(
    @Query("textSearch") textSearch: string,
    @Query("id") id: string,
  ) {
    return this.masterService.getProvinces(textSearch, +id);
  }

  @ApiQuery({
    required: false,
    description: "For text search like name, id etc.",
    name: "textSearch",
  })
  @ApiQuery({
    required: false,
    description: "",
    name: "id",
  })
  @ApiQuery({
    required: false,
    description: "",
    name: "province_id",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("district")
  getDistrict(
    @Query("textSearch") textSearch: string,
    @Query("id") id: string,
    @Query("province_id") province_id: string,
  ) {
    return this.masterService.getDistrict(textSearch, +id, +province_id);
  }

  @ApiQuery({
    required: false,
    description: "For text search like name, id etc.",
    name: "textSearch",
  })
  @ApiQuery({
    required: false,
    description: "",
    name: "id",
  })
  @ApiQuery({
    required: false,
    description: "",
    name: "district_id",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("subDistrict")
  getSubDistrict(
    @Query("textSearch") textSearch: string,
    @Query("id") id: string,
    @Query("district_id") district_id: string,
  ) {
    return this.masterService.getSubDistrict(textSearch, +id, +district_id);
  }

}
