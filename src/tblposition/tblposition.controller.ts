import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpException } from '@nestjs/common';
import { TblPositionService } from './tblposition.service';
import { CreateTblpositionDto, EditPositionBody } from './dto/create-tblposition.dto';
import { UpdateTblpositionDto } from './dto/update-tblposition.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { Response } from 'express';

@ApiTags('position')
@UseGuards(RolesGuard)
@Controller('tblposition')
export class TblpositionController {
  constructor(private readonly tblpositionService: TblPositionService) {}

  @Post()
  @Role(100, 1)
  @ApiBearerAuth()
  create(@Body() createTblpositionDto: CreateTblpositionDto) {
    return this.tblpositionService.create(createTblpositionDto);
  }

  @Get()
  @Role(100, 1, 2)
  @ApiBearerAuth()
  findAll() {
    return this.tblpositionService.findAll();
  }

  @Post('delete_tblposition/:PID')
  @Role(100, 1)
  @ApiBearerAuth()
  async deletePosition(
    @Res() res: Response,
    @Param('PID') PID: number
  ) {
    const data = await this.tblpositionService.deletePosition(PID)
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.status)
    }
  }

  @Post('edit_tblposition/:PID')
  @Role(100, 1)
  @ApiBearerAuth()
  async editPoition(
    @Res() res: Response,
    @Param('PID') param: number,
    @Body() body: EditPositionBody
  ) {
    const data = await this.tblpositionService.editPoition(param, body)
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.status)
    }
  }
}
