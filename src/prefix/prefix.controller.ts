import { Controller, Get, Post, Param, Body, Delete, Put, UseGuards } from '@nestjs/common';
import { PrefixService } from './prefix.service';
import { CreatePrefixDto } from './dto/create-prefix.dto';
import { UpdatePrefixDto } from './dto/update-prefix.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from 'src/guards/roles.decorator';

@ApiTags('prefix')
@UseGuards(RolesGuard)
@Controller('prefix')
export class PrefixController {
  constructor(private readonly prefixService: PrefixService) {}

  @Post()
  @Role(100, 1)
  @ApiBearerAuth()
  create(@Body() createPrefixDto: CreatePrefixDto) {
    return this.prefixService.create(createPrefixDto);
  }

  @Get()
  @Role(100, 1)
  @ApiBearerAuth()
  findAll() {
    return this.prefixService.findAll();
  }

  @Get(':id')
  @Role(100, 1)
  @ApiBearerAuth()
  findOne(@Param('id') id: number) {
    return this.prefixService.findOne(id);
  }

  @Post(':id')
  @Role(100, 1)
  @ApiBearerAuth()
  update(@Param('id') id: number, @Body() updatePrefixDto: UpdatePrefixDto) {
    return this.prefixService.update(id, updatePrefixDto);
  }

  @Post(':id')
  @Role(100, 1)
  @ApiBearerAuth()
  remove(@Param('id') id: number) {
    return this.prefixService.remove(id);
  }
}
