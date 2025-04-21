import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Put, Res, UseGuards, HttpException } from '@nestjs/common';
import { TblmasterService } from './tblmaster.service';
import { CreateTblmasterDto } from './dto/create-tblmaster.dto';
import { UpdateTblmasterDto } from './dto/update-tblmaster.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, statSync } from 'fs';
import { Response } from 'express';
import { Role } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/role.guard';

@ApiTags('tblmaster')
@UseGuards(RolesGuard)
@Controller('source_type')
export class TblmasterController {
  constructor(private readonly tblmasterService: TblmasterService) {}
  @Post('upload')
  @Role(1)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a logo for the source type with mas_name' }) 
  @ApiConsumes('multipart/form-data') 
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mas_name: { type: 'string', description: 'Name of the source type' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, jpeg, png only)',
        },
      },
    },
  }) 
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mas_name: string },
  ) {
    this.tblmasterService.uploadLogo(file.filename, body.mas_name);
    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
    };
  }
  @Get('image/:filename')
  streamFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(__dirname, '../..', 'uploads', filename);
    const stat = statSync(filePath);

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': stat.size,
    });

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
  @Get()
  @Role(100, 1, 2)
  @ApiBearerAuth()
  findAll() {
    return this.tblmasterService.findAll();
  }

  @Get(':id')
  // @Role(1)
  // @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.tblmasterService.findOne(+id);
  }
  
  @Post('upload/:mas_id')
  @Role(1)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a logo for the source type with mas_name' }) 
  @ApiConsumes('multipart/form-data') 
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mas_name: { type: 'string', description: 'Name of the source type' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, jpeg, png only)',
        },
      },
    },
  }) 
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateuploadFile(
    @Param('mas_id') mas_id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mas_name: string },
  ) {
    const filename = file ? file.filename : '';
  
  
    const updatedMaster = await this.tblmasterService.updateMaster(mas_id, filename, { mas_name: body.mas_name });
    
    return {
      success: true,
      filename: file?.filename || '',
      originalname: file?.originalname || '',
      size: file?.size || 0,
      mas_id,
    };
  }
  

  @Post(':mas_id')
  @Role(1)
  @ApiBearerAuth()
  async deleteMaster(@Param('mas_id') mas_id: number) {
    await this.tblmasterService.deleteMaster(mas_id);
    return {
      success: true,
      message: `Record with ID ${mas_id} has been deleted`
    }
  }

  @Post('delete_sourcetype/:mas_id')
  @Role(1)
  @ApiBearerAuth()
  async deleteSourceType(
    @Res() res: Response,
    @Param('mas_id') param: number
  ) {
    const data = await this.tblmasterService.deleteSourceType(param)
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.status)
    }
  }
}