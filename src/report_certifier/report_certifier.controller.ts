import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ReportCertifierService } from './report_certifier.service';
import { UpdatedReportCertifierBody } from './dto/report_certifier.dto';
import { Request, Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('ReportCertifier')
@Controller('report-certifier')
export class ReportCertifierController {
  constructor(private readonly reportCertifierService: ReportCertifierService) {}

  @Post(':id/update')
  @ApiBearerAuth()
  async updateReportCertifier(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: UpdatedReportCertifierBody,
    @Param('id') param: string
) {
    const user = req.user
    if (!user) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }
    console.log(user);
    if (!param) {
      throw new HttpException('parameter is required', HttpStatus.BAD_REQUEST)
    }
    
    const data = await this.reportCertifierService.ReportCertifier(body, param, user);
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.message)
    }
  }

  @Get()
  @ApiBearerAuth()
  async getReportCertifier(
    @Res() res: Response,
    @Req() req: Request
  ) {
    const data = await this.reportCertifierService.getReportCertifier();
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.message)
    }
  }
}
