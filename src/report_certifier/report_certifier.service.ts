import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdatedReportCertifierBody } from './dto/report_certifier.dto';
import { Sequelize } from 'sequelize-typescript';
import { ReportCertifier } from 'src/models/report_certifier.model'
import * as moment from 'moment';

@Injectable()
export class ReportCertifierService {
  constructor(private readonly sequelize: Sequelize) {}


  async ReportCertifier(
    body: UpdatedReportCertifierBody,
    param: string,
    user,
  ) {
    const { certificate_name, certificate_role } = body
    try {
      const getReportCertifier = await ReportCertifier.findOne(
        {
          where: {
            id: param
          }
        }
      )
      if (!getReportCertifier) {
        throw new HttpException('data not found', HttpStatus.NOT_FOUND)
      }

      console.log('user service >>>> ',user);
      const updateBody = {
        certificate_name: certificate_name? certificate_name : getReportCertifier.certificate_name,
        certificate_role: certificate_role? certificate_role : getReportCertifier.certificate_role,
        updated_at: moment().utc().format(),
        updated_by: user.username,
      }

      const updateData = await ReportCertifier.update(
        updateBody,
        {
          where: {
            id: getReportCertifier.id
          }
        }
      );
        const data = await ReportCertifier.findOne(
          {
            where: {
              id: getReportCertifier.id
            },
            attributes: [
              ['id', 'reportId'],
              ['report_type', 'reportName'],
              ['certificate_name', 'reportCertificate'],
              ['certificate_role', 'reportCertificateRole'],
            ],
          }
        )
        const newData = {
          reportid: data.id,
          reportName: data.report_type,
          reportCertificate: data.certificate_name,
          reportCertificateRole: data.certificate_role
        }
      

      
      
      return {
        success: true,
        data: data,
        message: 'Updated report certifier successfully'
      }
    } catch (error) {
      return {
        success: false,
        error,
        message: 'Updated report certifier failure'
      }
    }


  }

  async getReportCertifier() {
    try {
      const data = await ReportCertifier.findAll()
      const newData = data.map((item) => {
        return {
          reportid: item.id,
          reportName: item.report_type,
          reportCertificate: item.certificate_name,
          reportCertificateRole: item.certificate_role
        }
      }
  );

      console.log('data >>>>>> ',data)
      console.log('newData >>>>>> ',newData)
      return {
        success: true,
        data: newData,
        message: "Get report certifier successfully"
      }
    } catch (error) {
      return {
        success: false,
        error,
        message: 'get report certifier failure'
      }
    }
  }
}
