import { Controller, Get, Post, Param, Body, Delete, Put, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from 'src/guards/roles.decorator';

@ApiTags('Role')
@UseGuards(RolesGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Role(100, 1)
  @ApiBearerAuth()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @Role(100, 1)
  @ApiBearerAuth()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @Role(100, 1)
  @ApiBearerAuth()
  findOne(@Param('id') id: number) {
    return this.roleService.findOne(id);
  }

  @Post(':id')
  @Role(100, 1)
  @ApiBearerAuth()
  update(@Param('id') id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Post(':id')
  @Role(100, 1)
  @ApiBearerAuth()
  remove(@Param('id') id: number) {
    return this.roleService.remove(id);
  }
}
