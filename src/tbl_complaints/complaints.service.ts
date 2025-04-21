import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Complaints } from 'src/models/complaints.model';
import { TblMaster } from 'src/models/master.model';
import { TblDepartment } from 'src/models/department.model';
import { CreateTblComplaintDto, } from './dto/create-complaints.dto';
import { UpdateTblComplaintDto } from './dto/update-complaints.dto';
import { Op } from 'sequelize';
import { RolesGuard } from 'src/guards/role.guard';
import path, { extname } from 'path';
import * as fs from 'fs'
import { ReportCertifier } from 'src/models/report_certifier.model';
const moment = require('moment-timezone');


@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaints)
    private readonly tblComRepo: typeof Complaints,
    @InjectModel(TblMaster)
    private readonly tblMasterRepo: typeof TblMaster,
    @InjectModel(TblDepartment)
    private readonly tblDepartmentRepo: typeof TblDepartment,
  ) {}

  async create(createTblComplaintDto: CreateTblComplaintDto, user) {
    try {
      
      if (!createTblComplaintDto.source_type || !createTblComplaintDto.complaint_type || !createTblComplaintDto.category_type) {
        return {
          success: false,
          message: 'Missing required fields: source_type, complaint_type, or category_type',
        };
      }
  
      let complaintOther = null;
      if (createTblComplaintDto.complaint_type === "12") {
        complaintOther = createTblComplaintDto.complaint_other;
      }
  
      if (createTblComplaintDto.anonymous === true) {
        createTblComplaintDto.first_name = 'ไม่ระบุตัวตน';
        createTblComplaintDto.last_name = null;
      }
  
      const currentDate = moment().utcOffset('+07:00').toDate();
  
      const dateReceived = createTblComplaintDto.date_received && moment(createTblComplaintDto.date_received).isBefore(currentDate)
        ? createTblComplaintDto.date_received
        : currentDate;
  
      const receivedAt = currentDate;
  
      let progressAt = null;
      if (createTblComplaintDto.notified_office && createTblComplaintDto.document) {
        progressAt = currentDate;
      }
  
      let terminateAt = null;
      if (createTblComplaintDto.status === '3') {
        terminateAt = currentDate;
      }

      if (createTblComplaintDto.notified_office) {
        const deptofficeno = await this.tblDepartmentRepo.findOne({
          where: {
            deptofficeno: Number(createTblComplaintDto.notified_office),
          },
          attributes: ['depttype', 'deptofficeno', 'deptgroup'],
        });
  
        if (deptofficeno.depttype === 1) {
          createTblComplaintDto.notified_office = String(deptofficeno.deptofficeno);
          createTblComplaintDto.sub_notified_office = null
  
  
        }
        if (deptofficeno.depttype === 2) {
          createTblComplaintDto.sub_notified_office = createTblComplaintDto.sub_notified_office = String(deptofficeno.deptofficeno);
          createTblComplaintDto.notified_office = createTblComplaintDto.notified_office = String(deptofficeno.deptgroup);
          const subNoti = await this.tblDepartmentRepo.findOne(
            {
              where: {
                deptofficeno: Number(createTblComplaintDto.sub_notified_office)
              }
            }
          )
        }
         else {
          console.error("No department found for notified_office:", createTblComplaintDto.notified_office);
        }
      }
  
      const status = (createTblComplaintDto.notified_office && createTblComplaintDto.document) ? 2 : 1;

      let userId;

      const certifier = await ReportCertifier.findOne({
        where: {
          id: 1
        }
      })
      console.log('certifier >>>>>>>>> ',certifier);
      console.log('certifier >>>>>>>>> ',certifier.id);
      

      let certificateBy;
      let certificateRole;

      if (status == 2) {
         userId = user.id
         certificateBy = certifier.certificate_name
         certificateRole = certifier.certificate_role
      }
  
      const newComplaint = await this.tblComRepo.create({
        ...createTblComplaintDto,
        complaint_other: complaintOther,
        date_received: dateReceived,
        receive_at: receivedAt,
        progress_at: progressAt,
        terminate_at: terminateAt,
        created_at: currentDate,
        updated_at: currentDate,
        deleted_at: null,
        date_closed: createTblComplaintDto.date_closed || null,
        status: status,
        created_by: user.id,
        receive_by: userId,
        certifier_by: certificateBy,
        certifier_role: certificateRole,
      });
      
  
      return {
        success: true,
        data: newComplaint,
      };
    } catch (error) {
      console.error('Error creating complaint:', error);
      return {
        success: false,
        error,
        message: 'Create failed',
      };
    }
  }
  
  
  
  // async createComplaint(attachments: any): Promise<Complaints> {
  //   return await this.tblComRepo.create({
  //     ...attachments,
  //   });
  // }
  
  async createOrUpdateComplaint(cid: number, attachments: any, type: string): Promise<Complaints> {
    let complaint: Complaints;
  
    if (cid) {
      complaint = await this.tblComRepo.findByPk(cid);
      if (complaint) {
        // เช็คสถานะก่อนที่จะตั้งค่า type เป็น 'close'
        if (complaint.status !== '2' && complaint.status !== '3' && type === 'close') {
          throw new Error('Cannot set type as "close" because status is not 2 or 3');
        }
  
        // ถ้า type เป็น 'close'
        if (type === 'close') {
          // ตรวจสอบว่าไม่สามารถเพิ่ม attachment_received ได้
          if (Object.keys(attachments).some(key => key.startsWith('attachment_received'))) {
            throw new BadRequestException(`Cannot update "received" attachments when type is "close"`);
          }
          
          // เพิ่มไฟล์ในฟิลด์ attachment_closed ที่ว่างถัดไป
          this.addAttachmentToNextField(complaint, attachments, 'closed');
          
          // ปรับปรุงสถานะถ้ามีข้อมูลที่เกี่ยวข้อง
          if (complaint.date_closed || complaint.explanation_result || 
              complaint.attachment_closed1 || complaint.attachment_closed2 || 
              complaint.attachment_closed3 || complaint.attachment_closed4 || 
              complaint.attachment_closed5) {
            complaint.status = '3';
          }
        } else {
          // ถ้า type ไม่ใช่ 'close'
          if (Object.keys(attachments).some(key => key.startsWith('attachment_closed'))) {
            throw new BadRequestException(`Cannot update "closed" attachments when type is not "close"`);
          }
          
          // เพิ่มไฟล์ในฟิลด์ attachment_received ที่ว่างถัดไป
          this.addAttachmentToNextField(complaint, attachments, 'received');
        }
  
        // ปรับปรุงเวลาที่ปรับปรุง
        complaint.updated_at = new Date();
        await complaint.save();
      } else {
        throw new NotFoundException(`Complaint with cid ${cid} not found`);
      }
    } else {
      throw new Error('something wrong');
    }
  
    return complaint;
  }
  
  private addAttachmentToNextField(complaint: Complaints, attachments: any, type: string): void {
    const attachmentFields = type === 'closed' 
      ? ['attachment_closed1', 'attachment_closed2', 'attachment_closed3', 'attachment_closed4', 'attachment_closed5']
      : ['attachment_received1', 'attachment_received2', 'attachment_received3', 'attachment_received4', 'attachment_received5'];
    
    let fieldIndex = 0;

    // Loop through each attachment and assign it to the next available field
    for (const attachment of Object.values(attachments)) {
        while (fieldIndex < attachmentFields.length) {
            const fieldName = attachmentFields[fieldIndex];
            if (!complaint[fieldName]) {  // Check if field is empty
                complaint[fieldName] = attachment;
                fieldIndex++;  // Move to the next field
                break;
            }
            fieldIndex++;
        }
    }
}
  
  async findDropDown(mas_group_code: string) {
    try {
      const category = await this.tblMasterRepo.findAll({
        where: {
          mas_group_code: mas_group_code
        },
        attributes: ['mas_name', 'mas_code'],
        order: ['mas_seq']
      })
      return {
        category_type: {
          category
        },
      }
    }
    catch(error) {
      console.log(error);
      
    }
  }
  async findAll(page: number = 1, query) {
    const limit = query.page_size ? parseInt(query.page_size) : 10;
  
  
    try {
      const whereCondition: any = {
        deleted_at: null
      };
  
      if (query.startDate && query.endDate) {
        whereCondition.receive_at = {
          [Op.between]: [
            moment(query.startDate).startOf('day').toDate(),
            moment(query.endDate).endOf('day').toDate(),
          ],
        };
      }
  
      if (query.document) {
        whereCondition.document = {
          [Op.like]: `%${query.document}%`
        };
      }
  
      if (query.status) {
        if (['1', '2', '3'].includes(query.status)) {
          whereCondition.status = query.status;
        } else {
          throw new Error('Invalid status');
        }
      }
  
      if (query.category_type) {
        whereCondition.category_type = query.category_type
      }
  
      if (query.complaint_type) {
        whereCondition.complaint_type = query.complaint_type
      }
  
      if (query.notified_office) {
        var noti = await this.tblDepartmentRepo.findOne({
            where: {
                deptofficeno: query.notified_office
            },
            attributes: ['depttype', 'deptofficeno']
        });
    
    
        if (noti?.depttype === 1) {
            whereCondition.notified_office = {
                [Op.eq]: query.notified_office
            };
            whereCondition.sub_notified_office = null;
        }
        if (noti?.depttype === 2) {
          
            whereCondition.sub_notified_office = {
                [Op.eq]: query.notified_office
            };
        }
    }
    if (noti?.depttype === 1) {
        whereCondition.sub_notified_office = null;
    }
    
    
  
      if (query.source_type) {
        whereCondition.source_type = query.source_type
      }
  
      // if (!query.includeDeleted) {
      //   whereCondition.deleted_at = null;
      // }
  
      let order;

        if (order) {
          order = [['created_at', 'DESC']];
        } else {
          order = [['updated_at', 'DESC']];

        }

      const { count, rows } = await this.tblComRepo.findAndCountAll({
        where: whereCondition,
        limit,
        offset: (page - 1) * limit,
        order
      });
  
      const has_previous_page = page > 1;
      const has_next_page = (page * limit) < count;
  
      const complaintsWithDetails = await Promise.all(rows.map(async complaint => {
        let categoryData = null;
        let complaintType = null;
        let notifiedData = null;
        let sourceData = null;
  
        const category = await this.tblMasterRepo.findOne({
          where: {
            mas_group_code: '1',
            mas_code: complaint.category_type,
          },
        });
  
        const complaint_type = await this.tblMasterRepo.findOne({
          where: {
            mas_code: complaint.complaint_type,
            mas_group_code: complaint.category_type === '1'
              ? '2'
              : complaint.category_type === '2'
              ? '3'
              : null
          }
        });
  
        const source_type = await this.tblMasterRepo.findOne({
          where: {
            mas_code: complaint.source_type,
            mas_group_code: "4"
          }
        });
  
        let notified_office = await this.tblDepartmentRepo.findOne({
          where: {
            deptofficeno: complaint.sub_notified_office
          }
        });
        if(!notified_office) {
          notified_office = await this.tblDepartmentRepo.findOne({
            where: {
              deptofficeno: complaint.notified_office
            }
          })
        }
  
        categoryData = category ? category.get() : null;
        complaintType = complaint_type ? complaint_type.get() : null;
        sourceData = source_type ? source_type.get() : null;
        notifiedData = notified_office ? notified_office.get() : null;
  
        const complaintDetails = {
          ...complaint.get(),
          date_received: moment(complaint.get().date_received).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
          date_closed: complaint.get().date_closed ? moment(complaint.get().date_closed).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss') : null,
          receive_at: moment(complaint.get().receive_at).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
          progress_at: moment(complaint.get().progress_at).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
          terminate_at: moment(complaint.get().terminate_at).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
          created_at: moment(complaint.get().created_at).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
          updated_at: moment(complaint.get().updated_at).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'),
          category: categoryData,
          complaint: complaintType,
          source: sourceData,
          notified: notifiedData,
        };
  
        return complaintDetails;
      }));
  
      const page_count = Math.ceil(count / limit);
  
      return {
        success: true,
        data: complaintsWithDetails,
        meta: {
          page,
          total: count,
          page_size: limit,
          page_count,
          has_previous_page,
          has_next_page
        }
      };
    } catch (error) {
      console.error('Error finding complaints:', error);
      throw new Error('Failed to find complaints');
    }
  }

  async findOne(cid: number) {
    try {
      const complaint = await this.tblComRepo.findByPk(cid);
      
      if (!complaint) {
        throw new Error('Complaint not found');
      }
      return complaint;
    } catch (error) {
      console.error('Error finding complaint:', error);
      throw new Error('Failed to find complaint');
    }
  }

  async update(
    cid: number,
    updateTblComplaintDto: UpdateTblComplaintDto,
    user
  ): Promise<Complaints> {

    
    const complaint = await this.tblComRepo.findOne({ where: { cid } });
  
    if (!complaint) {
      return null;
    }
  
    if (complaint.status === '2' && updateTblComplaintDto.status === '1') {
      throw new Error('Cannot change status from 2 to 1');
    }
    const fieldsToCheck = [
      'attachment_received1', 'attachment_received2', 'attachment_received3', 'attachment_received4', 'attachment_received5',
      'attachment_closed1', 'attachment_closed2', 'attachment_closed3', 'attachment_closed4', 'attachment_closed5'
    ];
    fieldsToCheck.forEach(field => {
      if (updateTblComplaintDto[field] === "") {
        updateTblComplaintDto[field] = complaint[field];
      }
    });
    if (updateTblComplaintDto.notified_office) {
      const deptofficeno = await this.tblDepartmentRepo.findOne({
        where: {
          deptofficeno: Number(updateTblComplaintDto.notified_office),
        },
        attributes: ['depttype', 'deptofficeno', 'deptgroup'],
      });

      if (deptofficeno.depttype === 1) {
        updateTblComplaintDto.notified_office = String(deptofficeno.deptofficeno);
        updateTblComplaintDto.sub_notified_office = null


      }
      if (deptofficeno.depttype === 2) {
        updateTblComplaintDto.sub_notified_office = updateTblComplaintDto.sub_notified_office = String(deptofficeno.deptofficeno);
        updateTblComplaintDto.notified_office = updateTblComplaintDto.notified_office = String(deptofficeno.deptgroup);
        const subNoti = await this.tblDepartmentRepo.findOne(
          {
            where: {
              deptofficeno: Number(updateTblComplaintDto.sub_notified_office)
            }
          }
        )
      }
       else {
        console.error("No department found for notified_office:", updateTblComplaintDto.notified_office);
      }
    }

  
    let status = complaint.status;
  
    const notified_office = updateTblComplaintDto.notified_office || complaint.notified_office;
    const document = updateTblComplaintDto.document || complaint.document;
  
    if (notified_office && document) {
      const date_closed = updateTblComplaintDto.date_closed || complaint.date_closed;
      const explanation_result = updateTblComplaintDto.explanation_result || complaint.explanation_result;
  
      let userId;
      
      if (!date_closed || !explanation_result) {
        status = '2';
      }
    }    
  
    const date_closed = updateTblComplaintDto.date_closed || complaint.date_closed;
    const explanation_result = updateTblComplaintDto.explanation_result || complaint.explanation_result;
  
    if (status === '2' && date_closed && explanation_result) {
      status = '3';
    }
    let progressAt = complaint.progress_at;
    if (status === '2') {
      progressAt = moment().utcOffset('+07:00').toDate(); // Use toDate() for Date type
    }
    
    // Set terminate_at if status is updated to 3
    let terminateAt = complaint.terminate_at;
    if (status === '3') {
      terminateAt = moment().utcOffset('+07:00').toDate(); // Use toDate() for Date type
    }

    let userId 
    const getReportCertifier = await ReportCertifier.findOne(
      {
        where: {
          id: 1
        }
      }
    )
    let certifierBy
    let certifierRole
    if (status === '2') {
      userId = user.id
      certifierBy = getReportCertifier.certificate_name
      certifierRole = getReportCertifier.certificate_role
    }
    
    const updatedComplaint = {
      ...updateTblComplaintDto,
      status,
    
      // Keep date_received, date_closed, receive_at, etc.
      date_received: updateTblComplaintDto.date_received
        ? moment(updateTblComplaintDto.date_received).utcOffset('+07:00').isBefore(moment())
          ? moment(updateTblComplaintDto.date_received).utcOffset('+07:00').toDate() // Use toDate() for Date type
          : moment().utcOffset('+07:00').toDate() 
        : complaint.date_received,
    
      date_closed: updateTblComplaintDto.date_closed
        ? moment(updateTblComplaintDto.date_closed).utcOffset('+07:00').isBefore(moment())
          ? moment(updateTblComplaintDto.date_closed).utcOffset('+07:00').toDate() // Use toDate() for Date type
          : moment().utcOffset('+07:00').toDate() 
        : complaint.date_closed,
    
      receive_at: updateTblComplaintDto.receive_at
        ? moment(updateTblComplaintDto.receive_at).utcOffset('+07:00').isBefore(moment())
          ? moment(updateTblComplaintDto.receive_at).utcOffset('+07:00').toDate() // Use toDate() for Date type
          : moment().utcOffset('+07:00').toDate()
        : complaint.receive_at,
    
      progress_at: progressAt || complaint.progress_at,
      terminate_at: terminateAt || complaint.terminate_at,
    
      created_at: complaint.created_at,
      updated_at: moment().utcOffset('+07:00').toDate(),
      receive_by: userId,
      updated_by: userId,
      certifier_by: certifierBy,
      certifier_role: certifierRole,
    };
  
    await this.tblComRepo.update(updatedComplaint, { where: { cid } });
  
    const updatedComplaintData = await this.tblComRepo.findOne({ where: { cid } });
  
    return updatedComplaintData;
  }
  
  async remove(id: number) {
    try {
      await this.tblComRepo.destroy({ where: { cid: id } });
      return 'Complaint removed successfully';
    } catch (error) {
      console.error('Error removing complaint:', error);
      throw new Error('Failed to remove complaint');
    }
  }
  async softDelete(id: number, user): Promise<number> {
    try {
      const result = await this.tblComRepo.update(
        { deleted_at: new Date(), deleted_by: user.id },
        { where: { cid: id, deleted_at: null } }
      );
  
      return result[0];
    } catch (error) {
      console.error('Error performing soft delete:', error);
      throw new Error('Failed to soft delete complaint');
    }
  }

  async getFiles(param: number, query: string) {
    try {
      const getFile = await this.tblComRepo.findOne(
        {
          where: {
            cid: param
          },
        }
      )


      const result = [];
      const fields = [
        'attachment_received1', 
        'attachment_received2', 
        'attachment_received3',
        'attachment_received4', 
        'attachment_received5',
        'attachment_closed1',
        'attachment_closed2',
        'attachment_closed3',
        'attachment_closed4',
        'attachment_closed5',
      ];
      for (const field of fields) {
        const record = await this.tblComRepo.findOne({
          where: { 
            [field]: query,
            cid: param
           },
          attributes: [field]
        });
        if (record) {
          result.push(record);
          break;
        }
      }
    
      if (result.length === 0) {
        throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          result
        },
        message: 'getFile success'
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error,
        message: 'getFile failure'
      }
    }
  }

  async uploadFiles(files: Express.Multer.File[], type: string, cid) {
    try {
      const filePaths = files.map(file => ({
        filename: `${file.originalname}`,
        path: `/uploads/${file.filename}` 
    }));
  
      const existingData = await this.tblComRepo.findOne({
        where: {
          cid: cid
        }
      });
  
      if (!existingData) {
        throw new Error(`Complaint with CID ${cid} not found`);
      }
  
      let fieldsToCheck = [];
      // Mapping fields to check for attachments
      if(type == 'close') {
        fieldsToCheck = [
          'attachment_closed1', 'attachment_closed2', 'attachment_closed3',
          'attachment_closed4', 'attachment_closed5'
        ];

      } else {

        fieldsToCheck = [
         'attachment_received1', 'attachment_received2', 'attachment_received3',
         'attachment_received4', 'attachment_received5'
       ];
      }
      
      const attachments = {};
      
      
      // Assign new files to empty fields
      let fileIndex = 0;
      for (const field of fieldsToCheck) {
        if (!existingData[field] && fileIndex < files.length) {
          attachments[field] = filePaths[fileIndex].path;
          fileIndex++;
        }  else {
          attachments[field] = existingData[field]; // Retain existing file path
        }
      }
  
      // Update database with new attachments
      await this.tblComRepo.update(attachments, {
        where: {
          cid: cid
        }
      });
      

  
      return {
        success: true,
        data: attachments,
        message: 'Files uploaded and record updated successfully!'
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error,
        message: 'Upload File failure'
      };
    }
  }

  async fixDelete(param: number, body:  string) {
    try {
      // const { filename } = body
      
      const fieldsToCheck = [
        'attachment_received1', 'attachment_received2', 'attachment_received3',
        'attachment_received4', 'attachment_received5'
      ];

      
      const getFile = await this.tblComRepo.findOne(
        {
          where: {
            cid: param,
          }
        }
      )
      
      const result = [];

      return {
        success: true,
        data: {
          result
        },
        message: 'delete file success'
      }

    } catch (error) {
      console.log(error);
      return {
        success: false,
        error,
        message: 'delete failure'
      }
    }
  }

    async getComplaint(cid: number, query) {
      try {
        let complaint;
         complaint = await this.tblComRepo.findOne(
          {
          where: {
            cid: cid,
            notified_office: query.notified_office
          },
        }
      );

      const getNoti = await this.tblDepartmentRepo.findOne(
        {
          where: {
            deptofficeno: Number(complaint.sub_notified_office) ?
            Number(complaint.sub_notified_office) : Number(complaint.notified_office)
          },
          attributes: ['deptofficeno']
        }
      )

      if (complaint.sub_notified_office !== null) {
        complaint = await this.tblComRepo.findOne(
          {
            where: {
              cid: complaint.cid,
              sub_notified_office: getNoti.deptofficeno
            }
          }
        )
      }
  
    
      
  
        
        if (!complaint) {
          throw new Error('Complaint not found');
        }
        return complaint;
      } catch (error) {
        console.error('Error finding complaint:', error);
        throw new Error('Failed to find complaint');
      }
    }
  }