import { Controller, Get, HttpException, HttpStatus, Query, Render, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { get } from 'lodash';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as QRCode from 'qrcode';
import { ReportService } from './report.service';
import { ReportData, Summarymouth } from './report.dto';
import { CreateTblComplaintDto } from 'src/tbl_complaints/dto/create-complaints.dto';
import { ComplaintsService } from 'src/tbl_complaints/complaints.service';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from 'src/guards/roles.decorator';
import { UserRequest } from 'src/guards/jwt-auth.guard';
import { toBudishYearMonth, toThaiWord } from 'src/hbs/helpers';

dayjs.extend(utc);
dayjs.extend(timezone);


@UseGuards(RolesGuard)
@ApiTags('Report')
@Controller({
  version: '1',
  path: 'report',
})
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly complaintsService: ComplaintsService,
  ) { }

  @ApiQuery({
    required: true,
    description: "For complain id, 1 etc.",
    name: "cid",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("export")
  async export(@Query("cid") cid: string, @Res() res: Response, @Req() req: Request, @Req() token: UserRequest): Promise<void> {
    const authHeader = req.headers.hasOwnProperty('authorization') ? req.headers['authorization'] : null;
    const user = token.user

    const buffer = await this.reportService.getReport(cid, authHeader, user);

    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${encodeURIComponent('รายงานแบบรับเรียนร้องเรียน')}.pdf`,
      'Content-Length': buffer.length,

      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0,
    })

    res.end(buffer)
  }

  // @ApiQuery({
  //   required: true,
  //   description: "For complain year_month, 1 etc.",
  //   name: "year_month",
  // })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("export_director")
  async exportDirector(@Query("year_month") year_month: string, @Res() res: Response, @Req() req: Request): Promise<void> {
    // ${process.env.REPORT_SERVER}
    // const url = `http://localhost:3001/api/v1/report/view_monthly_summary?year_month=${year_month}`;
    const authHeader = req.headers['authorization'];

    // const buffer = await this.reportService.getReport2(year_month, authHeader);
    const buffer = await this.reportService.getReport2(year_month, authHeader);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${encodeURIComponent('รายงานเรียนอธิการบดี')}.pdf`,
      'Content-Length': buffer.length,

      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0,
    })

    res.end(buffer)
  }


  @ApiQuery({
    required: true,
    description: "For complain year_month, 1 etc.",
    name: "year_month",
  })
  @Get("export_monthly_summary")
  async exportMonthlySummary(
    @Query("year_month") year_month: string,
    @Query("preview") preview: string,
    @Res() res: Response,
    @Req() req: Request): Promise<void> {
    // ${process.env.REPORT_SERVER}
    // const url = `http://localhost:3001/api/v1/report/view_monthly_summary?year_month=${year_month}`;

    // const authHeader = req.headers['authorization'];
    console.log('preview >>>> ', preview);

    let test = `attachment; filename=${encodeURIComponent('สรุปผลรายงานประจำเดือน')}.pdf`

    if (preview && preview === 'true') {
      console.log('If =======');
      test = `inline; filename=${encodeURIComponent('สรุปผลรายงานประจำเดือน')}.pdf`
    }

    console.log('test pdf9999999999999999999999999999999 >>>>>>> ', test);

    const buffer = await this.reportService.getReport3(year_month);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': test,
      'Content-Length': buffer.length,

      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0,
    })

    res.end(buffer)
  }

  @ApiQuery({
    required: true,
    description: "For url",
    name: "url",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("export_tool")
  async exportTool(@Query("url") url: string, @Res() res: Response, @Req() req: Request): Promise<void> {
    // ${process.env.REPORT_SERVER}
    // const url = `http://localhost:3001/api/v1/report/view_monthly_summary`;
    // const authHeader = req.headers['authorization'];
    const buffer = await this.reportService.getReport3(url);
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${encodeURIComponent('สรุปผลรายงานส่งอธิการบดี')}.pdf`,
      'Content-Length': buffer.length,

      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0,
    })

    res.end(buffer)
  }

  static thaiMonths(num) {
    if (!num) {
      return '';
    }
    const months_th = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",];
    return months_th[num - 1];
  }

  static thaiMonthsMini(num) {
    if (!num) {
      return '';
    }
    const months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",];
    return months_th[num - 1];
  }

  static thaiNumber(num) {
    if (!num) {
      return '';
    }
    const array = { "1": "๑", "2": "๒", "3": "๓", "4": "๔", "5": "๕", "6": "๖", "7": "๗", "8": "๘", "9": "๙", "0": "๐" };
    let str = num + ''.toString();
    for (let val in array) {
      str = str.split(val).join(array[val]);
    }
    return str;
  }

  static toThaiDate(date: Date) {
    if (!date) {
      return '';
    }
    // const new_date = date.toISOString().substring(0, 10);
    const new_date = dayjs(date).tz('Asia/Bangkok').format('YYYY-MM-DD');
    return `${ReportController.thaiNumber(new_date.substring(8, 10))} ${ReportController.thaiMonths(new_date.substring(5, 7))} ${ReportController.thaiNumber(Number(new_date.substring(0, 4)) + 543)}`;
  }

  static toThaiTime(date: Date) {
    if (!date) {
      return '';
    }
    const new_date = dayjs(date).tz('Asia/Bangkok').format('HH:mm');
    return `${ReportController.thaiNumber(new_date.substring(0, 2))}.${ReportController.thaiNumber(new_date.substring(3, 5))}`;
  }

  // @Role(1)
  // @ApiBearerAuth()
  @Get("receive_complaint")
  @Render('report1')
  async receiveComplaint(@Query("cid") cid: string,
    @Req() req: UserRequest
  ) {
    try {

      const user = req.user

      let complain

      const complain_data = await this.reportService.getComplainById(Number(cid));
      const current_date = new Date();

      const getUser = await this.reportService.getUser(cid)
      const fullName = await getUser.data.setName
      const position = await getUser.data.pos

      console.log('controller data >>>>>>> ', complain_data);

      let masGroupCodeId = 0
      if (complain_data.category_type == 1) {
        masGroupCodeId = 2
      }
      if (complain_data.category_type == 2) {
        masGroupCodeId = 3
      }

      const complain_type = await this.reportService.getComplainTypeByGroup(String(masGroupCodeId));



      console.log('Complaint Type >>>>>> ', complain_type);


      const complain_type_new = complain_type.map(item => {
        let is_select = false;
        let area = '';
        let road = '';
        if (item.dataValues.mas_code === complain_data.complaint_type) {
          is_select = true;
          area = complain_data.area;
          if (item.dataValues.mas_code === '1') {
            road = complain_data.road + ''
          }
        }
        const isShort = area.length < 50;
        const complaintOther = complain_data.complaint_other ? complain_data.complaint_other.length : 0;
        
        // if (complaintOther > 50) {
        //   throw new HttpException('messeage is over length', HttpStatus.BAD_REQUEST)
        // }
        const other = complain_data.complaint_type === '12'
        
        return {
          mas_code: item.dataValues.mas_code,
          mas_name: item.dataValues.mas_name,
          is_select,
          is_road: item.dataValues.mas_code === '1',
          road,
          is_other: other,
          area,
          isShort,
          complaint_other: complain_data.complaint_other + ''.replace(/\n/g, "<br>"),
          basePath: `${process.env.REPORT_BASEPATH}`
        };
      });

      console.log('new Type >>>> ', complain_type_new);
      console.log('1111============= >>>> ', complain_data.source_name);
      console.log('4444============= >>>> ', complain_data);
      console.log('2222============= >>>> ', complain_data.additional_contact);
      console.log('3333============= >>>> ', complain_data.additional_contact);
      let complainName;
      let receive_type = 'รับเรื่องวันที่';
      let time = 'เวลา';
      let receiveTime = ReportController.toThaiTime(complain_data.date_received);
      let receiveDate = ReportController.toThaiDate(complain_data.date_received);
      let reporter_phone_number = ReportController.thaiNumber(get(complain_data, 'phone_number'))
      console.log('reporter_phone_number >>>>>> ',reporter_phone_number);
      

      let underline;
      let headUnderline;
      if (complain_data.source_type == 8) {
        receive_type = 'รหัสเรื่อง'
        time = ''
        receiveTime = ''
        receiveDate = complain_data.additional_contact
        underline = 'displayNone'
        headUnderline = 'displayNone'

      }
      if (complain_data.source_type == 6 || complain_data.source_type == 14) {
        time = null
        underline = 'displayNone'
        headUnderline = 'displayNone'
      }
      if (time == null) {
        receiveTime = null
      }
      const reportType = 1

      const reportCertifier = await this.reportService.getReportCertifier(reportType);

      console.log('reportCertifier >>>>>> ',reportCertifier);

      const certifierName = reportCertifier.certificate_name
      const certifierRole = reportCertifier.certificate_role


      
      



      return {
        complain_type: complain_type_new,
        current_date: ReportController.toThaiDate(complain_data.progress_at),
        source_name: complain_data.source_name,
        document_no: ReportController.thaiNumber(complain_data.document),
        reporter_phone_number: ReportController.thaiNumber(get(complain_data, 'phone_number')),
        message: 'Hello world!',
        receive_type: receive_type,
        time: time,
        receive_date: receiveDate,
        headUnderline: headUnderline,
        underline: underline,
        receive_time: receiveTime,
        // receive_by: 'คุณปัทมา นิยมวงค์',
        // receive_position: 'นักประชาสัมพันธ์',
        receive_by: fullName,
        receive_position: position,
        director_by: complain_data.certifier_by,
        director_position: complain_data.certifier_role,
        complain_data: complain_data,
        basePath: `${process.env.REPORT_BASEPATH}`
      };
    } catch (error) {
      console.log('Here File>>>>>>>>>>>>>', error);

    }
  }



  @Get("view_monthly_summary")
  @Render('report_monthly_summary')
  async viewMonthlySummary(@Query('year_month') monthYear?: string) {

    console.log('summary >>>>');

    const date = dayjs(monthYear);
    const year = date.year();
    const month = date.month() + 1;

    console.log('date>>>',date.format('MM-BBBB'))


    const complaints = await this.reportService.getComplaints(monthYear);
    const complaintplatform = await this.reportService.getComplaintPlatform(year, month);
    const getProgress = await this.reportService.getProgress(year)
    const gettop3complaint = await this.reportService.getTop3Complaint(year, month)
    const getcasemonth = await this.reportService.getCaseMonth(year, month)
    const resultComplaint = await this.reportService.resultComplaint(year, month)
    const getSourceTypeComplaint = await this.reportService.getSourceTypeComplaint(year, month)
    const getTypeComplaint = await this.reportService.getTypeComplaint(year, month)


    const chart3data = resultComplaint.series['data'].map((value: string) => parseFloat(value));

    const thaiYearMonth = toThaiWord(monthYear);
    console.log('==11======44444444444444444444444==========', monthYear)

    const thaiMonth = toBudishYearMonth(monthYear)

    const complaintType1Format = chart3data.slice(0, 6).map((data, index) => ({
      data,
      name: resultComplaint.categories[index],
      color: ['#25507F', '#264B72', '#093563', '#0050A0', '#0050A0', '#007DF8'][index]
    }));

    const complaintType2Format = chart3data.slice(6, 12).map((data, index) => ({
      data,
      name: resultComplaint.categories[index + 6],
      color: ['#0F87FE', '#3098FE', '#3FC8E4', '#6DB6FE', '#9BCDFE', '#C3E0FD'][index]
    }));
    


    console.log('complaintType1Format', complaintType1Format)



    const totalData = getcasemonth.find(item => item.total !== undefined)
    const status3 = getcasemonth.find(item => item.status === '3');
    const status2 = getcasemonth.find(item => item.status === '2');

    const complaintInprogress = status2.status_count
    const complaintEnd = status3.status_count
    const complaintTotal = totalData.total

    console.log('Calulator pass 55555555555555555555555555555555 >>>>>>>', complaints)


    let testdata = {
      summarymonth: complaints,
      basePath: `${process.env.REPORT_BASEPATH}`,
      complaint: {
        conplaintData: getSourceTypeComplaint,
        conplaintType: getTypeComplaint,
      },
      complaintDataNumber: {
        complaintTotal: complaintTotal.toLocaleString(),
        complaintInprogress: complaintInprogress.toLocaleString(),
        complaintEnd: complaintEnd.toLocaleString(),
      },
      thaiYearMonth: thaiYearMonth,
      yearnow:year+543,
      yearbefore:year+542,
      thaiMonth:thaiMonth,
      complaintType: {
        complaintType1: complaintType1Format,
        complaintType2: complaintType2Format
      },

      chart1: {
        series: JSON.stringify(getProgress.series),
        categories: JSON.stringify(getProgress.categories)
      },
      chart2: {
        series: JSON.stringify({ data: complaintplatform.series }),
        categories: JSON.stringify(complaintplatform.categories)
      },
      chart3: {
        // series: JSON.stringify([1.00,10.24,5.55]),
        series: JSON.stringify(chart3data),
      },
      chart4: {
        series: JSON.stringify(gettop3complaint.series),
        categories: JSON.stringify(gettop3complaint.labels)
      },
    };

    console.log('test data7777777777777777777777777777777', testdata.chart2.series)
    return testdata
  }


  // @Role(1, 2) //OHM Comment
  // @ApiBearerAuth() //OHM Comment
  @Get("view_director")
  @Render('report_director')
  async viewDirector(@Query("year_month") year_month: string,) {
    const data: ReportData = await this.reportService.getReportDirector(year_month);
    const qrCodeImage = await QRCode.toDataURL(`${process.env.REPORT_SERVER}/api/v1/report/export_monthly_summary?year_month=${year_month}&preview=true`);
    console.log('BasePath >>>>>> ', `${process.env.REPORT_BASEPATH}`);
    console.log('data.certifierName >>>>>> ',data.certifierName)
    console.log('data.certifierRole >>>>>> ',data.certifierRole)

    return {
      year_month: year_month,
      sourceTypeAllText: data.sourceTypeAllText,
      dataSummarySource: data.dataSummarySource,
      dataSummaryComplaint: data.dataSummaryComplaint,
      dataSummaryDepartment: data.dataSummaryDepartment,
      countProgress: data.countProgress,
      countTerminate: data.countTerminate,
      percentProgress: data.percentProgress,
      percentTerminate: data.percentTerminate,
      topSourceType: data.topSourceType,
      topComplaint: data.topComplaint,
      topDepartment: data.topDepartment,
      certificateName: data.certifierName,
      certificateRole: data.certifierRole,
      qrCodeImage: qrCodeImage,
      basePath: `${process.env.REPORT_BASEPATH}`
    };
  }

  // @Role(1, 2)
  @ApiBearerAuth()
  @Get('summary_month')
  async getAllComplaints(@Query('monthYear') monthYear?: string): Promise<{ source_type: string; complaints: Summarymouth[] }[]> {

    const complaints = await this.reportService.getComplaints(monthYear);

    // Map the results to the expected structure
    return complaints.map(item => ({
      source_type: item.musname, // map musname to source_type
      complaints: item.complaints.map(complaint => ({ // map each complaint properly
        row_num: complaint.row_num,
        complaint_name: complaint.complaint_name,
        deptshort: complaint.deptshort,
        sub_deptshort: complaint.sub_deptshort,
        receive_at: complaint.receive_at,
        mas_name: complaint.mas_name,
        road: complaint.road,
        area: complaint.area,
        explanation_result: complaint.explanation_result,
      })),
    })
    );

  }
  // @Role(1, 2)
  @ApiBearerAuth()
  @Get('monthly-status')
  async getMonthlyStatus(@Res() response: Response) {
    try {
      const reportData = await this.reportService.reportTableByMonthAndYear();
      return response.status(200).json(reportData);
    } catch (error) {
      console.error('Error in getMonthlyStatus:', error);
      return response.status(500).json({
        message: 'Error while fetching report',
        error: error.message,
      });
    }
  }

  @Get("export_test")
  async exportTest(
    @Res() res: Response, 
    @Req() req: Request): Promise<void> {    
    const buffer = await this.reportService.getReportTest();
    res.set({
      // pdf
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=test.pdf`,
      'Content-Length': buffer.length,

      // prevent cache
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0,
    })

    res.end(buffer)
  }

  @Get("view_monthly_summary_test")
  @Render('report_monthly_summary_test')
  async viewMonthlySummaryTest(@Query('year_month') monthYear?: string) {
    console.log('summary >>>>');
    

    const complaints = await this.reportService.getComplaints(monthYear);


    complaints.map(item => {
      console.log('>>>', item.musname);
      console.log(item.complaints);
    });

    return {
      summarymonth: complaints,
      basePath: `${process.env.REPORT_BASEPATH}`
    };
  }

}
