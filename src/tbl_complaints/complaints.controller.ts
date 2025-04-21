import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Bind, UploadedFiles, NotFoundException, BadRequestException, Res, UseGuards, HttpException, HttpStatus, Req } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateTblComplaintDto, Querybody, QueryComplaint } from './dto/create-complaints.dto';
import { UpdateTblComplaintDto } from './dto/update-complaints.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import multer, { diskStorage } from 'multer';
import { extname, join } from 'path';
import { query, Response } from 'express';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from 'src/guards/roles.decorator';
import * as fs from 'fs';
import * as paths from 'path';
import { UserRequest } from 'src/guards/jwt-auth.guard';

@UseGuards(RolesGuard)
@ApiTags('complaints')
@Controller('complaints')
export class TblComplaintsController {
  constructor(private readonly tblComplaintsService: ComplaintsService) {}
  @Role(1, 2)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    description: 'format timestame = "2024-09-22 15:13:31.000"',
  })
  @ApiResponse({ status: 201, description: 'The complaint has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBody({
    description: 'Create complaint object',
    type: CreateTblComplaintDto,
    examples: {
      example1: {
        value: {
          "topic_header": "สำนักงานเลขานุการกรม กลุ่มบริหารข้อมูลข่าวสารและเรื่องราวร้องทุกข์ โทร. ๐ ๒๕๕๑ ๕๒๐๐",
          "certify_by": "Sample",
          "certify_role": "Sample",
          "officer_tel": "0124564988789789789",
          "officer_email": "Sample@Sample.com",
          source_type: "1",
          date_received: "2024-09-21T19:00:00+07:00",
          anonymous: false,
          first_name: "xxx",
          last_name: "xxx",
          phone_number: "08xxxxxxxx",
          additional_contact: "08xxxxxxxx",
          category_type: "1",
          complaint_type: "1",
          province: 1,
          district: 2,
          sub_district: 3,
          road: "string",
          area: "string",
          document: "complaint-doc.pdf",
          date_closed: null,
          explanation_result: "Pending",
          status: "1",
          receive_at: "2024-09-21T19:00:00+07:00",
          progress_at: null,
          terminate_at: null,
          notified_office: "1",
        },
      },
    },
  })
  @Role(1, 2)
  @ApiBearerAuth()
  async create(
    @Body() createTblComplaintDto: CreateTblComplaintDto,
    @Req() req: UserRequest
  ) {
    const user = req.user
    console.log('User >>>>>> ',user);
    
    
    // if (createTblComplaintDto) {
    //   if (!createTblComplaintDto.latitude) {
    //     createTblComplaintDto.latitude = null
    //   }
    //   if (!createTblComplaintDto.longitude) {
    //     createTblComplaintDto.longitude = null
    //   }
    // }
    return this.tblComplaintsService.create(createTblComplaintDto, user);
  }


@Role(1, 2)
@ApiBearerAuth()
@Post('upload/:cid')
@UseInterceptors(FilesInterceptor('files', 5, { 
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.originalname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
}))
@ApiResponse({ status: 201, description: 'Files uploaded and record created/updated successfully!' })
@ApiResponse({ status: 400, description: 'Invalid request. Cannot set type to "close" because status is not 2' }) // เพิ่มการอธิบาย error response
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['receive', 'close'],
        description: 'Specify whether the files are for receive or close attachments',
      },
      files: {
        type: 'array',
        maxItems: 5, 
        items: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
})
async uploadMultipleFiles(
  @Param('cid') cid: number,
  @UploadedFiles() files: Express.Multer.File[],
  @Body('type') type: string ,
  // @Res() res: Response
) {

  const filePaths = files.map(file => ({
    filename: file.originalname,
    path: file.path.replace(/\\/g, '/')
  }));

  

  let attachments = {};
  const complaint = await this.tblComplaintsService.findOne(cid); // ดึงข้อมูล complaint จากฐานข้อมูลก่อน

  if (type === 'receive') {
    attachments = {
      attachment_received1: filePaths[0] ? filePaths[0].path : (complaint.attachment_received1 !== "" ? complaint.attachment_received1 : null),
      attachment_received2: filePaths[1] ? filePaths[1].path : (complaint.attachment_received2 !== "" ? complaint.attachment_received2 : null),
      attachment_received3: filePaths[2] ? filePaths[2].path : (complaint.attachment_received3 !== "" ? complaint.attachment_received3 : null),
      attachment_received4: filePaths[3] ? filePaths[3].path : (complaint.attachment_received4 !== "" ? complaint.attachment_received4 : null),
      attachment_received5: filePaths[4] ? filePaths[4].path : (complaint.attachment_received5 !== "" ? complaint.attachment_received5 : null),
    };
  } else if (type === 'close') {
    if (complaint.status !== '2' && complaint.status !== '3') {
      throw new BadRequestException('Cannot set type to "close" because status is not 2 or 3');
    }

    attachments = {
      attachment_closed1: filePaths[0] ? filePaths[0].path : (complaint.attachment_closed1 !== "" ? complaint.attachment_closed1 : null),
      attachment_closed2: filePaths[1] ? filePaths[1].path : (complaint.attachment_closed2 !== "" ? complaint.attachment_closed2 : null),
      attachment_closed3: filePaths[2] ? filePaths[2].path : (complaint.attachment_closed3 !== "" ? complaint.attachment_closed3 : null),
      attachment_closed4: filePaths[3] ? filePaths[3].path : (complaint.attachment_closed4 !== "" ? complaint.attachment_closed4 : null),
      attachment_closed5: filePaths[4] ? filePaths[4].path : (complaint.attachment_closed5 !== "" ? complaint.attachment_closed5 : null),
    };
  } else {
    throw new Error('Invalid type. Please specify either "receive" or "close".');
  }

  // ลบภาพจากระบบถ้ามีการตั้งค่าให้ลบ (เช็คว่าภาพถูกลบ)
  this.checkForDeletedFiles(complaint, attachments);

  const updatedComplaint = await this.tblComplaintsService.createOrUpdateComplaint(cid, attachments, type);

  return { message: 'Files uploaded and record created/updated successfully!', complaint: updatedComplaint };
}

private checkForDeletedFiles(existingData, newAttachments) {
  try {
    const fieldsToCheck = [
      'attachment_received1', 'attachment_received2', 'attachment_received3', 'attachment_received4', 'attachment_received5',
      'attachment_closed1', 'attachment_closed2', 'attachment_closed3', 'attachment_closed4', 'attachment_closed5'
    ];
  
    fieldsToCheck.forEach(field => {
      if (existingData[field] && !newAttachments[field]) {
        // ลบไฟล์ออกจากระบบ
        this.deleteFile(existingData[field]);
      }
    });
    
  } catch (error) {
    console.log(error);
    
  }
}

private deleteFile(filePath: string) {
  try {
    // ลบไฟล์จากระบบไฟล์
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // ใช้ fs ลบไฟล์จากระบบ
    }
    
  } catch (error) {
    console.log(error);
    
  }
}

  @Role(1, 2)
  @ApiBearerAuth()
  @Get('master/dropdown')
  @ApiQuery({ name: 'mas_group_code', type: String, required: false, description: 'Category_type = 1, Complaint_type = 2, 3 , Source_type = 4' })
  async findDropDown(
    @Query('mas_group_code') mas_group_code: string) {
    return await this.tblComplaintsService.findDropDown(mas_group_code);
  }
  @Role(1, 2)
  @ApiBearerAuth()
  @Get()
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number for pagination (default: 1)' })
  @ApiQuery({ name: 'page_size', type: Number, required: false, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'startDate', type: String, required: false, description: 'Filter by start date (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, required: false, description: 'Filter by end date (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'document', type: String, required: false, description: 'Search by document name' })
  @ApiQuery({ name: 'status', type: String, required: false, enum: ['1', '2', '3'], description: 'Filter by complaint status (1, 2, 3)' })
  @ApiQuery({ name: 'category_type', type: String, required: false, description: 'Filter by category type' })
  @ApiQuery({ name: 'complaint_type', type: String, required: false, description: 'Filter by complaint type' })
  @ApiQuery({ name: 'notified_office', type: String, required: false, description: 'Filter by notified_office type' })
  @ApiQuery({ name: 'source_type', type: String, required: false, description: 'Filter by source type' })
  @ApiResponse({ status: 200, description: 'Successfully fetched complaints' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Failed to find complaints' })
  async findAll(
    @Query('page') page: number = 1,
    @Query() query: any,
  ) {
    return await this.tblComplaintsService.findAll(page, query);
  }
  @Role(1, 2)
  @ApiBearerAuth()
  @Get('get_complaint/:cid')
  async findOne(
    @Param('cid') cid: number, 
    @Query() query: QueryComplaint
) {
    return await this.tblComplaintsService.getComplaint(cid, query);
  }

  @Role(1, 2)
  @ApiBearerAuth()
  @Post('update/:id')
  @ApiOperation({ summary: 'Update a complaint by ID' })
  @ApiResponse({ status: 200, description: 'The complaint has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  async update(
    @Param('id') cid: number, 
    @Body() updateTblComplaintDto: UpdateTblComplaintDto,
    @Req() req: UserRequest
  ) {
    const user = req.user
    
    
    if (updateTblComplaintDto) {
      // if (!updateTblComplaintDto.latitude) {
      //   updateTblComplaintDto.latitude = null
      // }
      // if (!updateTblComplaintDto.longitude) {
      //   updateTblComplaintDto.longitude = null
      // }
    const updatedComplaint = await this.tblComplaintsService.update(cid, updateTblComplaintDto, user);
  
    if (!updatedComplaint) {
      throw new NotFoundException(`Complaint with ID ${cid} not found`);
    }
  
    return { message: 'Complaint updated successfully!', complaint: updatedComplaint };
  }
  
}
  @Role(1, 2)
  @ApiBearerAuth()
  @Post(':id')
  @ApiOperation({ summary: 'Remove a complaint by ID' })
  @ApiResponse({ status: 200, description: 'The complaint has been successfully removed.' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  async remove(@Param('id') id: string) {
    return this.tblComplaintsService.remove(+id);
  }
  @Role(1, 2)
  @ApiBearerAuth()
  @Post('soft-delete/:id')
  @ApiOperation({ summary: 'Soft delete a complaint by ID' })
  @ApiResponse({ status: 200, description: 'The complaint has been soft deleted.' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  async softDelete(
    @Param('id') id: string,
    @Req() req: UserRequest,
  ): Promise<{ message: string }> {
    const user = req.user
    
    const result = await this.tblComplaintsService.softDelete(+id, user);
  
    if (result === 0) {
      throw new NotFoundException('Complaint not found');
    }
  
    return { message: 'Complaint soft deleted successfully' };
  }  

  @Get('get_file/:file')
  async getFile(
    @Res() res: Response,
    @Param('file') param: number,
    @Query('filename') query: string
  ) {

    try {
      const data = await this.tblComplaintsService.getFiles(param, query)
      const result = data.data.result;
      const path = result[0]?.dataValues[Object.keys(result[0].dataValues)[0]];
  
      if (!path) {
        throw new HttpException('File path not found', HttpStatus.NOT_FOUND);
      }
  
  
      const filePath = paths.join(process.cwd(), path); // ใช้ path ของไฟล์ที่ต้องการ

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        
        if (stats.size === 0) {
          console.log('File is empty');
        } else {
          console.log('File is not empty');
          
          // สร้าง ReadStream ถ้าไฟล์ไม่ว่าง
          var file = fs.createReadStream(filePath);
          // ทำการอ่านไฟล์ตามที่ต้องการ
          return file.pipe(res);
        }
      }); // สร้าง stream สำหรับอ่านไฟล์
      


      

    } catch (error) {
      console.log(error);
      
      throw new HttpException(error.response, error.status)
      
    }
  }

  @Post('fix_upload/:cid')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname); // ดึงนามสกุลไฟล์เดิม
          const filename = `${uniqueSuffix}${extension}`; // สร้างชื่อใหม่พร้อมนามสกุล
          callback(null, filename);
        }
      })
    })
  )
  @ApiResponse({ status: 201, description: 'Files uploaded and record created/updated successfully!' })
@ApiResponse({ status: 400, description: 'Invalid request. Cannot set type to "close" because status is not 2' }) // เพิ่มการอธิบาย error response
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['receive', 'close'],
        description: 'Specify whether the files are for receive or close attachments',
      },
      files: {
        type: 'array',
        maxItems: 5, 
        items: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
})
  async uploadFiles(
    @Res() res: Response,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('type') type: string,
    @Param('cid') cid: number
  ) {
    const data = await this.tblComplaintsService.uploadFiles(files, type, cid)
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.status)
    }
  }

  @ApiBearerAuth()
  @Post('fix_delete/:cid') 
  async fixDelete(
    @Res() res: Response,
    @Param('cid') param: number,
    @Body('filename') body: string
  ) {
    
    const data = await this.tblComplaintsService.fixDelete(param, body)
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.status)
    }
  }

  
}