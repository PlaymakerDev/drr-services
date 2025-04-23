import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes } from 'sequelize';
import { jsPDF } from "jspdf";
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { map, get, sumBy, orderBy, filter, find } from 'lodash';
import * as _ from 'lodash';
import { Complaints } from 'src/models/complaints.model';
import { TblDepartment } from 'src/models/department.model';
import { TblMaster } from 'src/models/master.model';
import { ComplaintsService } from 'src/tbl_complaints/complaints.service';
import { ReportData, ReportRow, Summarymouth } from './report.dto';
import { CreateTblComplaintDto } from 'src/tbl_complaints/dto/create-complaints.dto';
import * as moment from 'moment';
import { toThaiWord } from 'src/hbs/helpers';
import { User } from 'src/models/User.model';
import { Tblposition } from 'src/tblposition/entities/tblposition.entity';
import { TblPosition } from 'src/models/position.model';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit')

// PDFDocument.registerFontkit(fontkit);


@Injectable()
export class ReportService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(Complaints)
    private readonly complaints: typeof Complaints,
    @InjectModel(TblDepartment)
    private readonly tblDepartment: typeof TblDepartment,
    @InjectModel(TblMaster)
    private readonly tblMaster: typeof TblMaster,
    @Inject(ComplaintsService)
    private readonly complaintsService: ComplaintsService,
  ) { }
  // async getReport(dateSearch?: string): Promise<any> {
  //   try {
  //     const THSarabunNew = fs.readFileSync("src/resource/THSarabunNew/THSarabunNew.ttf", {
  //       encoding: "latin1"
  //     });
  //     const THSarabunNewBold = fs.readFileSync("src/resource/THSarabunNew/THSarabunNewBold.ttf", {
  //       encoding: "latin1"
  //     });

  //     const doc = new jsPDF();
  //     doc.addFileToVFS("THSarabunNew.ttf", THSarabunNew);
  //     doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
  //     doc.addFileToVFS("THSarabunNewBold.ttf", THSarabunNewBold);
  //     doc.addFont("THSarabunNewBold.ttf", "THSarabunNewBold", "bold");

  //     // doc.setFont("THSarabunNew");
  //     // doc.text("แบบรับเรื่องร้องเรียน ผ่านสายด่วน ๑๑๔๖", 10, 10);

  //     // doc.setFont("THSarabunNewBold", "bold");
  //     // doc.text("แบบรับเรื่องร้องเรียน ผ่านสายด่วน ๑๑๔๖", 10, 30);

  //     doc.save("src/export/a4_4.pdf");
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   return {};
  // }

  async getComplainById(cid: number): Promise<any> {
    try {
      const sql =
        `
        select c.*, st.mas_name as source_name 
        , p.name_th as province_name, d.name_th as district_name, sd.name_th as sub_district_name, dp.deptname
        from tbl_complaints c
        inner join tbl_master st on st.mas_code = c.source_type and st.mas_group_code = '4'
        left join tbl_master_provinces p on p.id = c.province 
        left join tbl_master_districts d on d.id = c.district 
        left join tbl_master_subdistricts sd on sd.id = c.sub_district 
        left join tbl_department dp on dp.deptofficeno =  c.notified_office
        where
        c.cid = ?
      `;

      const data = await this.sequelize.query(sql, {
        replacements: [cid]
      });
      console.log('additional_contact111========', data[0][0]['additional_contact'])
      console.log('service data >>>>>> ', data);
      const subNotiId = data[0][0]['sub_notified_office'];
      console.log({subNotiId});
      
      if (!subNotiId) {
        return data ? data[0][0] : [];
      }

      const findSub = await TblDepartment.findOne(
        {
          where: {
            deptofficeno: subNotiId
          },
          attributes: ['deptname']
        }
      )
      const noti = `${data[0][0]['deptname']} และ ${findSub.deptname}`
      console.log({noti});
      
      data[0][0]['deptname'] = noti;


      return data ? data[0][0] : [];
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  calcPercentage(num, sum, defaultV?) {
    if (!num) return defaultV ? defaultV : '-';
    return ((num / sum) * 100).toFixed(2);
  }

  prepareDataForView(data) {
    const sum_terminate = sumBy(data, 'count_terminate');


    let bottom_count_summary = 0;
    let bottom_count_progress = 0;
    let bottom_count_terminate = 0;
    let bottom_percent_terminate = 0;
    let bottom_percent_summary = 0;

    let new_result = map(data, item => {
      let count_summary = null;
      let percent_terminate = null;
      if (item['count_progress'] || item['count_terminate']) {
        count_summary = Number(get(item, 'count_progress', '0')) + Number(get(item, 'count_terminate', '0'));
        bottom_count_summary += count_summary;

        if (item['count_terminate']) {
          percent_terminate = this.calcPercentage(item['count_terminate'], count_summary);
        }
      }

      return {
        code: item['code'],
        name: item['name'],
        count_summary: count_summary,
        count_progress: item['count_progress'],
        count_terminate: item['count_terminate'],
        percent_terminate: percent_terminate,
      };
    });

    const sum_summary = sumBy(new_result, 'count_summary');

    let final_result = map(new_result, item => {
      let percent_summary = null;
      if (item.count_summary !== '-') {
        percent_summary = this.calcPercentage(item.count_summary, bottom_count_summary);
        bottom_percent_summary += Number(percent_summary);
      }

      // bottom_count_summary += get(item, 'count_summary', 0);
      bottom_count_progress += get(item, 'count_progress', 0);
      bottom_count_terminate += get(item, 'count_terminate', 0);
      bottom_percent_terminate += Number(get(item, 'percent_terminate', 0));

      return {
        ...item,
        count_summary: item.count_summary ? item.count_summary.toFixed(0) : '-',
        count_progress: item.count_progress ? item.count_progress.toFixed(0) : '-',
        count_terminate: item.count_terminate ? item.count_terminate.toFixed(0) : '-',
        percent_terminate: item.percent_terminate ? item.percent_terminate : '-',
        percent_summary: percent_summary ? percent_summary : '-'
      };
    });

    final_result.push({
      code: '0',
      name: 'รวม',
      count_summary: bottom_count_summary + '',
      count_progress: bottom_count_progress + '',
      count_terminate: bottom_count_terminate + '',
      percent_terminate: this.calcPercentage(bottom_count_terminate, bottom_count_summary, '0'),
      percent_summary: this.calcPercentage(bottom_count_summary, bottom_count_summary, '0'),
    });
    return final_result;
  }

  async getSummarySourceType(year_and_month: string): Promise<any> {
    try {
      const sql =
        `
        select m.mas_code as code , m.mas_name as name, c2.source_type_count as count_progress, c3.source_type_count as count_terminate 
        from tbl_master m
        left join (
          select c.source_type, count(c.source_type) as source_type_count FROM tbl_complaints c
          where c.category_type = '1' and c.status = '2' and DATE_FORMAT(c.progress_at, '%Y-%m') = ?
          group by c.source_type
        ) as c2
        on m.mas_code = c2.source_type
        left join (
          select c.source_type, count(c.source_type) as source_type_count FROM tbl_complaints c
          where c.category_type = '1' and c.status = '3' and DATE_FORMAT(c.terminate_at, '%Y-%m') = ?
          group by c.source_type
        ) as c3
        on m.mas_code = c3.source_type
        where m.mas_group_code = '4'
        order by m.mas_seq asc
      `;
      const data = await this.sequelize.query(sql, {
        replacements: [year_and_month, year_and_month]
      });
      const result = data ? data[0] : [];
      return this.prepareDataForView(result);
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  async getSummaryComplaintType(year_and_month: string): Promise<any> {
    try {
      const sql =
        `
        select m.mas_code as code , m.mas_name as name, c2.complaint_type_count as count_progress, c3.complaint_type_count as count_terminate 
        from tbl_master m
        left join (
          select c.complaint_type, count(c.complaint_type) as complaint_type_count FROM tbl_complaints c
          where c.category_type = '1' and c.status = '2' and DATE_FORMAT(c.progress_at, '%Y-%m') = ?
          group by c.complaint_type
        ) as c2
        on m.mas_code = c2.complaint_type
        left join (
          select c.complaint_type, count(c.complaint_type) as complaint_type_count FROM tbl_complaints c
          where c.category_type = '1' and c.status = '3' and DATE_FORMAT(c.terminate_at, '%Y-%m') = ?
          group by c.complaint_type
        ) as c3
        on m.mas_code = c3.complaint_type
        where m.mas_group_code = '2'
        order by m.mas_seq asc
      `;
      const data = await this.sequelize.query(sql, {
        replacements: [year_and_month, year_and_month]
      });
      const result = data ? data[0] : [];
      return this.prepareDataForView(result);
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  async getSummaryDepartment(year_and_month: string): Promise<any> {
    try {
      const sql =
        `
        select d.deptofficeno as code , d.deptname as name, c2.notified_office_count as count_progress, c3.notified_office_count as count_terminate 
        from tbl_department d
        left join (
          select c.notified_office, count(c.notified_office) as notified_office_count FROM tbl_complaints c
          where c.category_type = '1' and c.status = '2' and DATE_FORMAT(c.progress_at, '%Y-%m') = ?
          group by c.notified_office
        ) as c2
        on d.deptofficeno = c2.notified_office
        left join (
          select c.notified_office, count(c.notified_office) as notified_office_count FROM tbl_complaints c
          where c.category_type = '1' and c.status = '3' and DATE_FORMAT(c.terminate_at, '%Y-%m') = ?
          group by c.notified_office
        ) as c3
        on d.deptofficeno = c3.notified_office
        where d.depttype = 1
        order by d.deptofficeno asc
      `;
      const data = await this.sequelize.query(sql, {
        replacements: [year_and_month, year_and_month]
      });
      const result = data ? data[0] : [];
      return this.prepareDataForView(result);
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  async getComplainTypeByGroup(group_code: string): Promise<any> {
    try {
      const data = await this.tblMaster.findAll({
        attributes: ['mas_code', 'mas_name'],
        where: { mas_group_code: group_code },
        order: [
          ['mas_seq', 'ASC'],
        ],
        raw: false
      });
      return data;
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  // api/v1/receive_complaint
  // Report === แบบรับเรื่องร้องเรียน ผ่านสายด่วน 1146
  // กระดาษแนวตั้ง
  async getReport(cid: string, authHeader: string, user): Promise<any> {
    try {const complain_data = await this.getComplainById(Number(cid));
      const field_recive_file = ['attachment_received1','attachment_received2','attachment_received3','attachment_received4','attachment_received5'];
      const field_closed_file = ['attachment_closed1', 'attachment_closed2','attachment_closed3','attachment_closed4','attachment_closed5'];
  
      // Check if there are any attachments
      let hasAttachment = field_recive_file.some(field => 
        complain_data[field] !== undefined && complain_data[field] !== null && complain_data[field] !== ''
      );
      let hasCloseAttachment = field_closed_file.some(field => 
        complain_data[field] !== undefined && complain_data[field] !== null && complain_data[field] !== ''
      );
  
      // Initialize PDF collections for each section
      const mainPdfFiles = [];
      const receivedPdfFiles = [];
      const closedPdfFiles = [];
  
      // Process received files to separate PDFs from other files
      let attachmentsHtml = '<div style="page-break-before: always; padding: 20px;"><h4>ไฟล์ประกอบการร้องเรียน</h4>';
      let haveAttach = false;
      
      for (let index = 0; index < field_recive_file.length; index++) {
        const element = field_recive_file[index];
        const filePath = complain_data[element];
        
        if (filePath) {
          const fileExt = path.extname(filePath).toLowerCase();
          
          // If it's a PDF, save it for later concatenation
          if (fileExt === '.pdf') {
            receivedPdfFiles.push({
              path: __dirname + '/../../' + filePath,
              name: path.basename(filePath)
            });
            continue; // Skip adding to HTML
          }
          
          haveAttach = true;
          const fileData = await fs.promises.readFile(__dirname + '/../../' + filePath);
          const fileName = path.basename(filePath);
          
          if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExt)) {
            const base64Data = fileData.toString('base64');
            const mimeType = fileExt === '.jpg' || fileExt === '.jpeg' ? 'image/jpeg' : 
                            fileExt === '.png' ? 'image/png' : 'image/gif';
            
            attachmentsHtml += `
              <div style="margin-bottom: 20px;">
                <img src="data:${mimeType};base64,${base64Data}" style="max-width: 100%; max-height: 300px;" />
              </div>
            `;
          } else if (['.txt', '.md', '.html', '.css', '.js'].includes(fileExt)) {
            const textContent = fileData.toString('utf-8');
            attachmentsHtml += `
              <div style="margin-bottom: 20px;">
                <pre style="background-color: #f5f5f5; padding: 10px; overflow-x: auto; max-height: 300px;">${textContent}</pre>
              </div>
            `;
          } else {
            attachmentsHtml += `
              <div style="margin-bottom: 20px;">
                <p>${fileName} (File attachment)</p>
              </div>
            `;
          }
        }
      }
      attachmentsHtml += '</div>';
      
      let closeAttachmentsHtml = '<div style="page-break-before: always; padding: 20px;"><h4>ไฟล์ประกอบการดำเนินงาน</h4>';
      let haveCloseAttach = false;
      
      for (let index = 0; index < field_closed_file.length; index++) {
        const element = field_closed_file[index];
        const filePath = complain_data[element];
        
        if (filePath) {
          const fileExt = path.extname(filePath).toLowerCase();
          
          if (fileExt === '.pdf') {
            closedPdfFiles.push({
              path: __dirname + '/../../' + filePath,
              name: path.basename(filePath)
            });
            continue; // Skip adding to HTML
          }
          
          haveCloseAttach = true;
          const fileData = await fs.promises.readFile(__dirname + '/../../' + filePath);
          const fileName = path.basename(filePath);
          
          if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExt)) {
            const base64Data = fileData.toString('base64');
            const mimeType = fileExt === '.jpg' || fileExt === '.jpeg' ? 'image/jpeg' : 
                            fileExt === '.png' ? 'image/png' : 'image/gif';
            
            closeAttachmentsHtml += `
              <div style="margin-bottom: 20px;">
                <img src="data:${mimeType};base64,${base64Data}" style="max-width: 100%; max-height: 300px;" />
              </div>
            `;
          } else if (['.txt', '.md', '.html', '.css', '.js'].includes(fileExt)) {
            const textContent = fileData.toString('utf-8');
            closeAttachmentsHtml += `
              <div style="margin-bottom: 20px;">
                <pre style="background-color: #f5f5f5; padding: 10px; overflow-x: auto; max-height: 300px;">${textContent}</pre>
              </div>
            `;
          } else {
            closeAttachmentsHtml += `
              <div style="margin-bottom: 20px;">
                <p>${fileName} (File attachment)</p>
              </div>
            `;
          }
        }
      }
      closeAttachmentsHtml += '</div>';
  
      // Launch browser and generate the three sections
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', "--disabled-setupid-sandbox"]
      });
      
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        Authorization: authHeader,
        user: JSON.stringify(user)
      });
      
      await page.goto(`${process.env.REPORT_SERVER}/api/v1/report/receive_complaint?cid=${cid}`);
      await page.emulateMediaType('screen');
      const mainBuffer = await page.pdf({
        format: 'A4',
        landscape: false,
        margin: { top: '50px', right: '50px', bottom: '10px', left: '50px' },
        printBackground: false,
      });
      
      let receivedBuffer = null;
      if (haveAttach) {
        await page.setContent(attachmentsHtml, { waitUntil: 'domcontentloaded' });
        await page.emulateMediaType('screen');
        receivedBuffer = await page.pdf({
          format: 'A4',
          landscape: false,
          margin: { top: '50px', right: '50px', bottom: '10px', left: '50px' },
          printBackground: false,
        });
      }
      
      let closedBuffer = null;
      if (haveCloseAttach) {
        await page.setContent(closeAttachmentsHtml, { waitUntil: 'domcontentloaded' });
        await page.emulateMediaType('screen');
        closedBuffer = await page.pdf({
          format: 'A4',
          landscape: false,
          margin: { top: '50px', right: '50px', bottom: '10px', left: '50px' },
          printBackground: false,
        });
      }
      
      await browser.close();
      
      // Now combine all PDFs using pdf-lib
      const { PDFDocument } = require('pdf-lib');
      const finalPdfDoc = await PDFDocument.create();
      
      // 1. Add main form and its PDF attachments
      {
        const mainPdfDoc = await PDFDocument.load(mainBuffer);
        const copiedPages = await finalPdfDoc.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
        copiedPages.forEach(page => finalPdfDoc.addPage(page));
        
        // Add main PDF attachments if any
        for (const pdfFile of mainPdfFiles) {
          try {
            const pdfBytes = await fs.promises.readFile(pdfFile.path);
            const attachmentPdf = await PDFDocument.load(pdfBytes);
            const attachmentPages = await finalPdfDoc.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
            attachmentPages.forEach(page => finalPdfDoc.addPage(page));
          } catch (error) {
            console.error(`Error processing PDF file ${pdfFile.name}:`, error);
          }
        }
      }
      
      // 2. Add received attachments and their PDF attachments
      if (receivedBuffer) {
        const receivedPdfDoc = await PDFDocument.load(receivedBuffer);
        const copiedPages = await finalPdfDoc.copyPages(receivedPdfDoc, receivedPdfDoc.getPageIndices());
        copiedPages.forEach(page => finalPdfDoc.addPage(page));
        
        // Add received PDF attachments
        for (const pdfFile of receivedPdfFiles) {
          try {
            const pdfBytes = await fs.promises.readFile(pdfFile.path);
            const attachmentPdf = await PDFDocument.load(pdfBytes);
            const attachmentPages = await finalPdfDoc.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
            attachmentPages.forEach(page => finalPdfDoc.addPage(page));
          } catch (error) {
            console.error(`Error processing PDF file ${pdfFile.name}:`, error);
          }
        }
      }
      
      // 3. Add closed attachments and their PDF attachments
      if (closedBuffer) {
        const closedPdfDoc = await PDFDocument.load(closedBuffer);
        const copiedPages = await finalPdfDoc.copyPages(closedPdfDoc, closedPdfDoc.getPageIndices());
        copiedPages.forEach(page => finalPdfDoc.addPage(page));
        
        // Add closed PDF attachments
        for (const pdfFile of closedPdfFiles) {
          try {
            const pdfBytes = await fs.promises.readFile(pdfFile.path);
            const attachmentPdf = await PDFDocument.load(pdfBytes);
            const attachmentPages = await finalPdfDoc.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
            attachmentPages.forEach(page => finalPdfDoc.addPage(page));
          } catch (error) {
            console.error(`Error processing PDF file ${pdfFile.name}:`, error);
          }
        }
      }
      
      // Save the final combined PDF
      const finalPdfBytes = await finalPdfDoc.save();
      console.log(`Here's your PDF with all sections and attachments combined!`);
      return Buffer.from(finalPdfBytes); }
     catch (e) {
      console.error(e);
    }
    return;
  }

  // async waitRender(page) {
  //   const bodyHandle = await page.$('#tracking');
  //   const html = await page.evaluate(body => body.innerHTML, bodyHandle);
  //   await bodyHandle.dispose();
  //   return html;
  // }

  async waitRender(page) {
    const bodyHandle = await page.$('#loadingchart');
    const html = await page.evaluate(body => body.innerHTML, bodyHandle);
    await bodyHandle.dispose();

    return html
  }

  async getReport2(year_month: string, authHeader: string): Promise<any> {
    function toThaiNumerals(number) {
      const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
      return number.toString().split('').map(digit => thaiDigits[digit]).join('');
    }

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', "--disabled-setupid-sandbox"]
      });

      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        Authorization: authHeader
      });

      await page.goto(`${process.env.REPORT_SERVER}/api/v1/report/view_director?year_month=${year_month}`, { waitUntil: "domcontentloaded" });

      await page.emulateMediaType('screen');

      await page.addStyleTag({
        content: `
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
      
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.ttf') format('truetype');
            font-weight: bold;
            font-style: italic;
          }
      
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.ttf') format('truetype');
            font-weight: normal;
            font-style: italic;
          }
      
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
          }
      
          .data-table {
            page-break-after: always;
          }
          .label-head {
            font-family: 'THSarabunNew';
            font-size: 16px;
            font-weight: bold;
          }
        `
      });

      const buffer1 = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '50px',
          bottom: '100px',
          left: '50px',
          right: '50px',
        },
        pageRanges: '1',
      });

      const buffer2 = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '100px',
          bottom: '60px',
          left: '50px',
          right: '50px',
        },
        pageRanges: '2-',
      });



      await browser.close();

      const pdf1 = await PDFDocument.load(buffer1);
      const pdf2 = await PDFDocument.load(buffer2);
      const mergedPdf = await PDFDocument.create();

      const pages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
      pages1.forEach((page) => mergedPdf.addPage(page));

      const pages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
      pages2.forEach((page) => mergedPdf.addPage(page));

      const mergedBuffer = await mergedPdf.save();

      const pdfDoc = await PDFDocument.load(mergedBuffer);
      console.log('load success')

      pdfDoc.registerFontkit(fontkit);

      const fontBytes = fs.readFileSync('./public/fonts/THSarabunIT๙.ttf');
      const font = await pdfDoc.embedFont(fontBytes);

      const pages = pdfDoc.getPages();
      console.log('get page success')

      pages.forEach((page, index) => {
        if (index === 0) return;

        const { width, height } = page.getSize();
        const thaiPageNumber = toThaiNumerals(index + 1);
        page.drawText(`-${thaiPageNumber}-`, {
          x: 300, // จัดตำแหน่งตรงกลาง
          y: height - 50, // ระยะห่างจากขอบบน (header)
          size: 16,
          font: font,
          color: rgb(0, 0, 0),
        });
      });
      console.log('add number success')

      const modifiedPdfBuffer = await pdfDoc.save();
      console.log('buffer success')


      console.log(`Here's your PDF!.`);
      return modifiedPdfBuffer;
    } catch (e) {
      console.error(e);
    }
    return;
  }
  // api/v1/report/export_monthly_summary
  // Report3 === รายงานสรุปเรื่องร้องเรียนประจำเดือน
  // กระดาษแนวนอน


  async getComplaintPlatform(year: number, month: number): Promise<any> {
    console.log('getComplaintPlatform year =', year, ' month', month)
    try {
      if (!year && !month) {
        throw new HttpException('Error no date found', HttpStatus.NOT_FOUND)
      }
      const sql =
        `
            SELECT 
          tc.source_type, 
          tm.mas_code, 
          COUNT(tc.source_type) AS total_result, 
          tm.mas_name AS source_name, 
          DATE(tc.receive_at) 
      FROM 
          tbl_master tm
      LEFT JOIN 
          tbl_complaints tc 
          ON tc.source_type = tm.mas_code 
          AND (tc.receive_at IS NULL OR (YEAR(tc.receive_at) = ? AND MONTH(tc.receive_at) = ?))
      WHERE 
          tm.mas_group_code = 4 
          AND tc.deleted_at IS NULL
          and tc.category_type = 1
      GROUP BY 
          tm.mas_name, tm.mas_code
      ORDER BY 
          total_result DESC;
            `;

      const result = await this.sequelize.query(sql, {
        replacements: [year, month]
      });


      const data = result ? result[0] : [];

      const seriesraw: number[] = data.map(item => item['total_result']);
      console.log('seriesraw >>>>>>>>>>>>>>>>> ', seriesraw);

      const categories: string[] = data.map(item => item['source_name']);
      console.log('categories >>>>>>>>>>>>>>>>> ', categories);

      const totalSum = _.sum(seriesraw);
      console.log('totalSum >>>>>>>>>>>>>>>>', totalSum);

      const series = seriesraw.map(value => {
        const percentage = this.calcPercentage(value, totalSum);
        console.log('percentage >>>>>>>>>>>>>>>> ', percentage);

        return percentage;
      });

      console.log('total sum = ', series)





      return { series, categories };
    } catch (e) {
      console.error(e);
    }
  }

  async getTop3Complaint(year?: number, month?: number): Promise<any> {
    try {
      if (!year && !month) {
        // dayjs(dateSearch).tz('Asia/Bangkok').format('YYYY-MM');
        throw new HttpException('Error no date found', HttpStatus.NOT_FOUND)
      }

      const top3Department2 = await this.sequelize.query('SELECT deptofficeno from tbl_department');

      const deptOfficeNo = top3Department2[0].map(item => item['deptofficeno'] + '');

      const sql =
        `
       (
        select status, count(notified_office) as notified_office_count, notified_office, d.deptname from tbl_complaints c 
        inner join tbl_department d on c.notified_office = d.deptofficeno
        where (YEAR(progress_at) = ? AND MONTH(progress_at) = ?) and status = '2' and c.deleted_at is null and sub_notified_office is NULL
        and c.category_type = 1
        group by d.deptname
        order by d.deptofficeno 
        )
        union
        (
        select status, count(notified_office) as notified_office_count, notified_office, d.deptname from tbl_complaints c 
        inner join tbl_department d on c.notified_office = d.deptofficeno
        where (YEAR(receive_at) = ? AND MONTH(receive_at) = ?) and status = '3' and c.deleted_at is null and sub_notified_office is NULL
        and category_type = 1
        group by d.deptname
        order by d.deptofficeno
        )
        union
      (
      select status, count(sub_notified_office) as notified_office_count, sub_notified_office, d.deptname
      from tbl_complaints c 
      inner join tbl_department d on c.sub_notified_office = d.deptofficeno
      where (YEAR(progress_at) = ? AND MONTH(progress_at) = ?) and status = '2' and c.deleted_at is null and sub_notified_office is not NULL
      and category_type = 1
      group by d.deptname
      order by d.deptofficeno 
      )
      union
      (
      select status, count(sub_notified_office) as notified_office_count, sub_notified_office, d.deptname
      from tbl_complaints c 
      inner join tbl_department d on c.sub_notified_office = d.deptofficeno
      where (YEAR(terminate_at) = ? AND MONTH(terminate_at) = ?) and status = '3' and c.deleted_at is null and sub_notified_office is not NULL 
      and category_type = 1
      group by d.deptname
      order by d.deptofficeno
      )
      `;




      const replacements = [year, month, year, month, year, month, year, month,];
      const result = await this.sequelize.query(sql, {
        replacements
      });
      const data = result ? result[0] : [];

      let process_series: number[] = [];
      let close_series: number[] = [];
      let sum_series: number[] = [];
      let labels: string[] = [];



      const new_data = deptOfficeNo.map(async (item) => {

        let office_name;

        let found_process = find(data, { notified_office: item + '' });

        let found_close = find(data, { notified_office: item + '', status: '3' });
        if (!found_process && !found_close) return;

        if (found_process) {
          process_series.push(found_process['notified_office_count']);

          if (!office_name) {
            office_name = found_process['deptname'];
          }
        } else {
          process_series.push(0);
          // return;
        }

        if (found_close) {
          close_series.push(found_close['notified_office_count']);
          if (!office_name) {
            office_name = found_close['deptname'];
          }
        } else {
          close_series.push(0);
          // return;
        }

        sum_series.push(process_series[process_series.length - 1] + close_series[close_series.length - 1]);

        if (office_name) {
          labels.push(office_name);
        }
      });


      // Combine the series and labels into one array of objects
      if (labels && labels.length > 0 && process_series && close_series && sum_series) {
        let combinedData = labels.map((label, index) => ({
          label,
          process: process_series[index],
          close: close_series[index],
          sum: sum_series[index],
        }));

        // Sort the combined data by the 'sum' value in descending order
        combinedData.sort((a, b) => b.sum - a.sum);

        // Ensure there are at least 3 items before slicing
        combinedData = combinedData.slice(0, 3);

        // Update the series and labels with the sorted values
        labels = combinedData.map(item => item.label);
        process_series = combinedData.map(item => item.process);
        close_series = combinedData.map(item => item.close);
        sum_series = combinedData.map(item => item.sum);
      } else {
        console.error('Labels or one of the series arrays are undefined or empty:', {
          labels,
          process_series,
          close_series,
          sum_series,
        });
      }
      return {
        series: [
          { name: 'ดำเนินการอยู่', data: process_series },
          { name: 'ยุติ', data: close_series },
          { name: 'รวม', data: sum_series }
        ],
        labels
      };
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getSourceTypeComplaint(year?: number, month?: number): Promise<any> {
    try {
      if (!year && !month) {
        throw new HttpException('Error no date found', HttpStatus.NOT_FOUND)
      }
      const sql = `
                  SELECT COUNT(source_type) as result, mas_name FROM tbl_complaints
		inner join tbl_master on source_type = mas_code and mas_group_code = 4
        WHERE YEAR(receive_at) = ? AND MONTH(receive_at) = ?
        and deleted_at is null
        and category_type = 1
        GROUP BY source_type
        ORDER BY result DESC;  
          `;
      const result = await this.sequelize.query(sql, {
        replacements: [year, month]
      });
      const data = result ? result[0] : [];

      return data

    } catch (error) {
      console.error("Error getting progress data:", error);
      throw error;
    }
  }

  async getTypeComplaint(year?: number, month?: number): Promise<any> {
    try {
      if (!year && !month) {
        throw new HttpException('Error no date found', HttpStatus.NOT_FOUND)
      }
      const sql = `
      SELECT tm.mas_name, COUNT(tc.complaint_type) as result from tbl_master tm 
        inner join tbl_complaints tc on tm.mas_code = tc.complaint_type and tm.mas_group_code = 2
        WHERE YEAR(receive_at) = ? AND MONTH(receive_at) = ?
        and tc.deleted_at is NULL
        and category_type = 1
        GROUP BY tm.mas_name
        ORDER BY result DESC;
          `;
      const result = await this.sequelize.query(sql, {
        replacements: [year, month]
      });
      const data = result ? result[0] : [];

      return data

    } catch (error) {
      console.error("Error getting progress data:", error);
      throw error;
    }
  }

  async getProgress(year?: number): Promise<any> {
    try {
      if (!year) {
        throw new HttpException('Error no date found', HttpStatus.NOT_FOUND)
      }
      const oldYear = year - 1


      const sql = `
        (SELECT 
          DATE_FORMAT(
            CASE 
 	          WHEN status = '1' THEN receive_at
              WHEN status = '2' THEN receive_at
              WHEN status = '3' THEN receive_at
            END, '%Y-%m') AS year_and_month,
          COUNT(*) AS total_count
        FROM tbl_complaints
        WHERE status IN ( '1', '2', '3')
          AND (
            (YEAR(receive_at) BETWEEN ? AND ?)
          AND deleted_at IS NULL
          and category_type = 1
          )
        GROUP BY year_and_month
        ORDER BY year_and_month)
      `;

      const result: any = await this.sequelize.query(sql, {
        replacements: [
          oldYear, year,
        ]
      });

      let data = result ? result[0] : [];
      console.log(`data >>>>`, result);

      let series: any[] = [];
      let labels: string[] = [];

      // Create a map to store the counts for each year and month
      let yearMonthMap: { [key: string]: { [key: string]: number } } = {};

      // Fill the map with data
      data.forEach(item => {
        const yearAndMonth = item.year_and_month;
        const totalCount = item.total_count;

        // Get year and month (split from year_and_month string)
        const [year, month] = yearAndMonth.split('-');

        if (!yearMonthMap[year]) {
          yearMonthMap[year] = {};
        }

        yearMonthMap[year][month] = totalCount;

        // Add month to labels if not already present
        if (!labels.includes(month)) {
          labels.push(month);
        }
      });

      // Ensure that the current year and the previous year are included in the series
      const allYears = [dayjs().year(), dayjs().subtract(1, 'year').year()];  // Only current year and last year
      allYears.forEach(year => {
        if (!yearMonthMap[year]) {
          yearMonthMap[year] = {}; // Initialize with empty object for missing year
        }
      });

      // Convert the map into the required series format
      allYears.forEach(year => {
        let seriesData = [];
        labels.forEach(month => {
          // Push the total count for the month or 0 if not available
          seriesData.push(yearMonthMap[year][month] || 0);
        });

        // Push the year and corresponding data to series
        series.push({
          name: `ปี ${year + 543}`,  // Convert to Thai year format
          data: seriesData
        });
      });

      const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];

      let newLabel = []
      let newOlddateData = []
      let newDateData = []

      for (let monthIndex = 0; monthIndex < monthNames.length; monthIndex++) {
        const monthItem = monthNames[monthIndex];
        let found = false;

        for (let labelIndex = 0; labelIndex < labels.length; labelIndex++) {
          if (monthIndex == (Number(labels[labelIndex])) - 1) {
            console.log(`Found: monthItem ${monthItem} at monthNames index ${monthIndex}, labels index ${labelIndex}`);
            found = true;
            newLabel.push(Number(labels[labelIndex]))
            newOlddateData.push(Number(series[0].data[labelIndex]))
            newDateData.push(Number(series[1].data[labelIndex]))
            break;
          }
        }

        if (!found) {
          console.log(`Not found: monthItem ${monthItem} at monthNames index ${monthIndex}`);
          newLabel.push(Number(monthIndex) + 1)
          newOlddateData.push(0)
          newDateData.push(0)
        }
      }


      console.log('labels>>>', labels);
      console.log('newLabel>>>', newLabel)
      console.log('series>>>', series);
      console.log('newOlddateData>>>', newOlddateData)
      console.log('newDateData>>>', newDateData)

      series[1].data = newDateData;
      series[0].data = newOlddateData;

      console.log('series new>>>', series);

      // Format the result into the desired structure
      return {
        series: series,
        categories:
          newLabel.map(month => {
            const monthNames = [
              "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
              "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
            ];
            return monthNames[parseInt(month) - 1];
          })
      };

    } catch (error) {
      console.error("Error getting progress data:", error);
      throw error;
    }
  }

  async resultComplaint(year: number, mounth: number) {
    try {
      console.log('mounth >>>>>>> ', mounth);

      const newMounth = mounth

      const sql = `
      SELECT 
    COUNT(tc.complaint_type) AS total, 
    tm.mas_name, 
    tm.mas_code,
    DATE(tc.date_received)
    FROM 
    tbl_master tm
    LEFT JOIN 
    tbl_complaints tc 
    ON 
    tc.complaint_type = tm.mas_code
    and (
    YEAR(tc.receive_at) = ? AND MONTH(tc.receive_at) = ?
    )
    WHERE 
    tm.mas_group_code = '2'
    AND (tc.category_type = 1 OR tc.category_type IS NULL)
    and tc.deleted_at is null
    GROUP BY 
    tm.mas_name, tm.mas_code;`

      const result = await this.sequelize.query(sql, {
        replacements: [year, newMounth]
      })



      const cata = await this.sequelize.query(
        `
      select tm.mas_name from tbl_master tm
      where tm.mas_group_code = 2
      `
      )

      const categories = cata[0].map((row: any) => row.mas_name);
      const data = Array(categories.length).fill(0);

      let totalComplaints = 0;

      result[0].forEach((row: any) => {
        const { total, mas_name } = row;
        console.log('mas name >>>>>>>>>>>>>>', mas_name);
        console.log('row >>>>>>>>>>>>>>', row);

        const index = categories.indexOf(mas_name);
        console.log('index >>>>>>>>>> ', index);

        if (index !== -1) {
          data[index] += total;  // เพิ่มค่า total เข้าไปในตำแหน่งที่เหมาะสม
          totalComplaints += total;  // เพิ่มผลรวมทั้งหมด
        }
        console.log('totalComplaints >>>> ', totalComplaints);

      });


      const percentageData = data.map((value: any) => {
        return totalComplaints > 0 ? Number((value / totalComplaints) * 100).toFixed(2) : Number((value / totalComplaints) * 100).toFixed(2)
      });

      console.log('cata >>>> ', categories);

      console.log('percentageData >>>> ', percentageData);



      console.log('Data >>>>>>>>>> ', data);

      console.log('result >>>>>> ', result);

      const chart1 = {
        series:
        {
          data: percentageData // เปอร์เซ็นต์ที่คำนวณจาก data
        },
        categories: categories
      };

      console.log('chart  >>>>>>>>>>>>> ', chart1);


      return chart1

    } catch (error) {
      console.log(error);
    }
  }

  async getCaseMonth(year?: number, month?: number): Promise<any> {
    try {
      if (!year && !month) {
        throw new HttpException('Error no date found', HttpStatus.NOT_FOUND)
      }
      const sql = `
        SELECT status, COUNT(status) AS status_count FROM tbl_complaints
        WHERE YEAR(receive_at) = ? AND MONTH(receive_at) = ? AND status IN ('1', '2', '3') AND deleted_at IS NULL
        and category_type = 1
        GROUP BY status
        ORDER BY status
      `;

      const result = await this.sequelize.query(sql, {
        replacements: [year, month]
      });
      const data = result ? result[0] : [];

      let sumTotal = 0
      const statusMap = {
        1: { status: '1', status_count: 0, label: 'เรื่องร้องเรียน' },
        2: { status: '2', status_count: 0, label: 'กำลังดำเนินการ' },
        3: { status: '3', status_count: 0, label: 'ยุติ' },
        total: { total: sumTotal }
      };

      data.forEach(item => {
        statusMap[item['status']].status_count = item['status_count'];
        sumTotal += item['status_count']
      });
      statusMap['total'].total = sumTotal;
      return Object.values(statusMap);

    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getReport3(year_month: string,): Promise<any> {
    try {
      let pdfRaw = []
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', "--disabled-setupid-sandbox"]
      });

      const page = await browser.newPage();

      // เรียกฟังก์ชัน toThaiWord เพื่อแปลง year_month เป็นข้อความภาษาไทย
      const thaiYearMonth = toThaiWord(year_month);

      await page.goto(`${process.env.REPORT_SERVER}/api/v1/report/view_monthly_summary?year_month=${year_month}`, { waitUntil: "domcontentloaded" });

      // let html = '';
      // while (html !== 'ok') {
      //   html = await this.waitRender(page);
      //   console.log('loading chart ', html)
      // }

      // await console.log('loading pre success')
      // await console.log('loading success')

      await page.addStyleTag({
        content: `
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew-webfont.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
      
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bolditalic-webfont.ttf') format('truetype');
            font-weight: bold;
            font-style: italic;
          }
      
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_italic-webfont.ttf') format('truetype');
            font-weight: normal;
            font-style: italic;
          }
      
          @font-face {
            font-family: 'THSarabunNew';
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.eot');
            src: url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.eot?#iefix') format('embedded-opentype'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.woff') format('woff'),
                 url('${process.env.REPORT_BASEPATH}/public/fonts/thsarabunnew_bold-webfont.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
          }
      
          .data-table {
            page-break-after: always;
          }
          .label-head {
            font-family: 'THSarabunNew';
            font-size: 16px;
            font-weight: bold;
          }
        `
      });

      await page.emulateMediaType('screen');

      const firstSection = await page.pdf({
        format: 'A4',
        landscape: true,
        margin: { top: '30px', right: '40px', bottom: '50px', left: '40px' },
        displayHeaderFooter: false,
        printBackground: true,
        headerTemplate: `<div></div>`,
        footerTemplate: `<div></div>`,
        pageRanges: '1-3',
      });

      const secondSection = await page.pdf({
        format: 'A4',
        landscape: true,
        margin: { top: '30px', right: '40px', bottom: '50px', left: '40px' },
        displayHeaderFooter: false,
        printBackground: true,
        headerTemplate: `
        <div style="font-size:16px; width:100%; text-align:center; padding-top:10px; color: #333;">
          <span class="label-head">แบบรับเรื่องร้องเรียน ประจำ${thaiYearMonth}</span>
        </div>`,


        // headerTemplate: `<div></div>`,
        footerTemplate: `<div></div>`,
        pageRanges: '4-',
      });

      const firstPdfDoc = await PDFDocument.load(firstSection);
      const secondPdfDoc = await PDFDocument.load(secondSection);

      console.log('load pdf success >>>>>')

      const mergedPdf = await PDFDocument.create();
      const firstPdfPages = await mergedPdf.copyPages(firstPdfDoc, firstPdfDoc.getPageIndices());
      const secondPdfPages = await mergedPdf.copyPages(secondPdfDoc, secondPdfDoc.getPageIndices());
      console.log('copy pdf success >>>>>')

      firstPdfPages.forEach(page => mergedPdf.addPage(page));
      secondPdfPages.forEach(page => mergedPdf.addPage(page));
      console.log('merge pdf success >>>>>')

      const mergedPdfBytes = await mergedPdf.save();
      console.log('save pdf success >>>>>')

      // Do not close the browser here
      await browser.close();

      return mergedPdfBytes;

    } catch (e) {
      console.error(e);
    }
    return;
  }

  async commonSourceTypeAllText(): Promise<string> {
    try {
      const source_type = await this.complaintsService.findDropDown('4');
      let source_type_all = map(source_type?.category_type?.category.slice(0, -1), 'mas_name').join(', ');
      if (source_type?.category_type?.category.length > 1) {
        source_type_all += ` และ ${source_type.category_type.category[source_type.category_type.category.length - 1]['mas_name']}`;
      }
      return source_type_all;
    } catch (e) {
      console.error(e);
    }
    return '';
  }

  prepareDataForTopView(datas) {
    let output = '';
    if (datas.length > 1) {

      let newDataSummarySource = filter(datas, v => v.count_summary !== '-')
      newDataSummarySource = map(newDataSummarySource, v => ({
        ...v,
        count_summary: Number(v.count_summary)
      }))
      newDataSummarySource = orderBy(newDataSummarySource.slice(0, -1), ['count_summary'], ['desc']);
      const topSize = newDataSummarySource.length > 3 ? 3 : newDataSummarySource.length;
      let top = newDataSummarySource.slice(0, topSize);

      if (top.length > 1) {
        output = map(top.slice(0, -1), 'name').join(', ');
        output += ' และ ' + top.slice(-1)[0]['name'];
      } else {
        output = top[0]['name'];
      }

    }
    return output;
  }

  async getReportDirector(yearMonth: string): Promise<ReportData> {
    const reportData = new ReportData();
    try {
      reportData.sourceTypeAllText = await this.commonSourceTypeAllText();

      reportData.dataSummarySource = await this.getSummarySourceType(yearMonth);

      reportData.dataSummaryComplaint = await this.getSummaryComplaintType(yearMonth);

      reportData.dataSummaryDepartment = await this.getSummaryDepartment(yearMonth);

      if (reportData.dataSummarySource.length > 1) {
        const sumData = reportData.dataSummarySource.slice(-1)[0];
        if (sumData && sumData.count_summary !== '0') {
          reportData.countProgress = sumData.count_progress;
          reportData.countTerminate = sumData.count_terminate;
          reportData.percentProgress = (Number(sumData.count_progress) / Number(sumData.count_summary) * 100).toFixed(2)
          reportData.percentTerminate = (Number(sumData.count_terminate) / Number(sumData.count_summary) * 100).toFixed(2)
        }
      }

      reportData.topSourceType = this.prepareDataForTopView(reportData.dataSummarySource);
      reportData.topComplaint = this.prepareDataForTopView(reportData.dataSummaryComplaint);
      reportData.topDepartment = this.prepareDataForTopView(reportData.dataSummaryDepartment);

      const sql = `
      select * from report_certifier rc
      where rc.id = 2
      `
      const data = await this.sequelize.query(sql);
      console.log("data >>>>>>> ",data);
      const certificateName = data[0][0]['certificate_name'];
      const certificateRole = data[0][0]['certificate_role'];
      // console.log("certificateName >>>>>> ",certificateName)
      
      reportData.certifierName = certificateName
      reportData.certifierRole = certificateRole

    } catch (e) {
      console.error(e);
    }
    return reportData;
  }

  async getComplaints(monthYear?: string): Promise<{ musname: string, complaints: Summarymouth[] }[]> {
    if (!monthYear) {
      const currentDate = new Date();
      const currentMonthYear = currentDate.toISOString().substring(0, 7);
      monthYear = currentMonthYear;
    }



    const masterRecords = await this.sequelize.query(`
      SELECT m.mas_code AS code, m.mas_name AS name 
      FROM tbl_master m 
      WHERE m.mas_group_code = '4'
      ORDER BY m.mas_seq
      `);

    // const results: { musname: string, complaints: Summarymouth[] }[] = [];
    const results: { musname: string, complaints: Summarymouth[], yearMonth: string }[] = [];
    const records = masterRecords[0] as { code: string, name: string }[];
    const complaintsBySource: { [key: string]: Summarymouth[] } = {};
    let globalRowNum = 1;
    for (const record of records) {
      const code = record.code;
      const masName = record.name;

      const complaints = await this.sequelize.query(`
            SELECT ROW_NUMBER() OVER (ORDER BY c.cid) as row_num,
                d.deptshort,  
                sd.deptshort AS sub_deptshort, 
                c.receive_at, 
                c.complaint_type, 
                m.mas_name,  
                c.road, 
                c.area, 
                c.explanation_result,
                CASE 
                  WHEN c.status = 1 THEN 'รับเรื่อง'
                  WHEN c.status = 2 THEN 'กำลังดำเนินการ'
                  ELSE 'ยุติ'
                END as status
            FROM tbl_complaints c
            INNER JOIN tbl_master m ON m.mas_code = c.complaint_type AND m.mas_group_code = '2'
            INNER JOIN tbl_department d ON d.deptofficeno = c.notified_office AND d.depttype = 1
            LEFT JOIN tbl_department sd ON sd.deptofficeno = c.sub_notified_office AND sd.depttype = 2
            WHERE c.category_type = '1' 
                AND c.source_type = '${code}' 
                AND DATE_FORMAT(c.receive_at, '%Y-%m') = '${monthYear}'
            ORDER BY c.cid
        `);
      const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

      const toThaiNumerals = (num: number): string => {
        return num
          .toString()
          .replace(/\d/g, (digit) => "๐๑๒๓๔๕๖๗๘๙"[parseInt(digit)]);
      };

      const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = toThaiNumerals(date.getDate());
        const month = thaiMonths[date.getMonth()];
        const buddhistYear = toThaiNumerals(date.getFullYear() + 543 - 2500);

        return `${day} ${month} ${buddhistYear}`;
      };

      const complaintsData = complaints[0] as Summarymouth[];
      complaintsData.forEach(complaint => {
        if (complaint.receive_at) {
          complaint.receive_at = formatDate(complaint.receive_at);
        }

      });
      complaintsData.forEach((complaint, index) => {
        const Summarymouth: Summarymouth = {
          row_num: complaint.row_num,
          receive_at: complaint.receive_at,
          complaint_name: masName ? masName : "",
          deptshort: complaint.deptshort ? complaint.deptshort : "",
          sub_deptshort: complaint.sub_deptshort ? complaint.sub_deptshort : "",
          mas_name: complaint.mas_name ? complaint.mas_name : "",
          road: complaint.road ? complaint.road : "",
          area: complaint.area ? complaint.area : "",
          explanation_result: complaint.explanation_result ? complaint.explanation_result : "ไม่มีผลการอธิบาย",
          status: complaint.status
        };

        if (!complaintsBySource[masName]) {
          complaintsBySource[masName] = [];
        }
        complaintsBySource[masName].push(Summarymouth);
      });
    }

    // const thaiMonth = toBudishYearMonth(monthYear)
    const yearMonth = await toThaiWord(monthYear);
    for (const [musname, complaints] of Object.entries(complaintsBySource)) {
      results.push({ musname, complaints, yearMonth }); // เพิ่ม yearMonth ในแต่ละอ็อบเจ็กต์
    }

    // let test = 

    return results;
  }


  async reportTableByMonthAndYear(): Promise<any> {
    try {
      const sql = `
      SELECT
        DATE_FORMAT(receive_at, '%Y-%m') AS formatted_month, -- Use a unique alias
        COUNT(*) AS total_count,
        SUM(CASE WHEN status = '1' THEN 1 ELSE 0 END) AS status_1_count,
        SUM(CASE WHEN status = '2' THEN 1 ELSE 0 END) AS status_2_count,
        SUM(CASE WHEN status = '3' THEN 1 ELSE 0 END) AS status_3_count
      FROM
        tbl_complaints
      WHERE
        deleted_at IS NULL
      GROUP BY
        formatted_month -- Grouping by the alias here
      ORDER BY
        formatted_month DESC; -- Ordering by the alias
      `;

      // Send options to sequelize.query
      const result = await this.sequelize.query<ReportRow>(sql, {
        type: QueryTypes.SELECT,
        raw: true
      });

      const data = result ? result : [];

      const formattedData = data.map((row) => ({
        year_month: row.formatted_month,
        total: row.total_count,
        status_1 : row.status_1_count,
        status_2: row.status_2_count,
        status_3: row.status_3_count,
      }));

      return {
        data: formattedData,
      };
    } catch (error) {
      console.error('Error in reportTableByMonthAndYear:', error);
      throw new Error('Error while fetching report');
    }
  }

  async getUser(cid) {
    try {
      console.log('user service >>>> ');

      const getComplaint = await Complaints.findOne(
        {
          where: {
            cid: cid,
          }
        }
      )
      console.log('getComplaint >>>>>>> ', getComplaint);


      const getUser = await User.findOne(
        {
          where: {
            id: getComplaint.receive_by
          },
          attributes: ['first_name', 'last_name', 'position']
        }
      )
      console.log('getUser >>>>>>> ', getUser);

      const getPos = await TblPosition.findOne(
        {
          where: {
            PID: getUser.position
          },
          attributes: ['PName']
        }
      )
      console.log('getPos >>>>>>> ', getPos);


      const setName = `${getUser.first_name} ${getUser.last_name}`
      console.log('name >>>>> ', setName);

      const pos = getPos.PName
      return {
        success: true,
        data: {
          setName,
          pos
        },
        message: 'get success'
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error,
        message: 'get user fail'
      }
    }

  }

  async getReportTest(): Promise<any> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', "--disabled-setupid-sandbox", "--disable-web-security"]
      });

      const page = await browser.newPage();

      const thaiYearMonth = toThaiWord('2024-11');

      const html = `
      <html>
        <head></head>
        <body>
          <p>แบบรับเรื่องร้องเรียน ประจำ${thaiYearMonth}</p>
        </body>
      </html>
      `;

      await page.goto(`${process.env.REPORT_SERVER}/api/v1/report/view_monthly_summary_test?year_month=2024-10`, { waitUntil: "domcontentloaded" });
      await page.addStyleTag({
        content: `
        <html>
        <style>
          @font-face {
            font-family: 'THSarabunNew';
            src: url(data:application/font-woff;base64,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);
            font-weight: bold;
            font-style: normal;
          }
          .data-table {
            page-break-after: always;
          }
        </style>
        <body>
        <div style="font-size:10px; width:100%; text-align:center; padding-top:10px; color: #333;">
          <span style="font-size: 16px; font-weight: bold; font-family: 'THSarabunNew';">แบบรับเรื่องร้องเรียน ประจำ${thaiYearMonth}</span>
        </div>
        </body>
        </html>
        `,
      });

      await page.emulateMediaType('screen');
      const buffer = await page.pdf({
        format: 'A4',
        landscape: true,
        margin: { top: '90px', right: '40px', bottom: '50px', left: '40px' },
        displayHeaderFooter: true,
        headerTemplate: `
        <html>
        <style>
          @font-face {
            font-family: 'THSarabunNew';
            src: url(data:application/font-woff;base64,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);
            font-weight: bold;
            font-style: normal;
          }
        </style>
        <body>
        <div style="font-size:10px; width:100%; text-align:center; padding-top:10px; color: #333;">
          <span style="font-size: 16px; font-weight: bold; font-family: 'THSarabunNew';">แบบรับเรื่องร้องเรียน ประจำ${thaiYearMonth}</span>
        </div>
        </body>
        </html>
        `,
        footerTemplate: `<div></div>`,
      });

      await browser.close();

      console.log(`Here's your PDF!.`);
      return buffer;
    } catch (e) {
      console.error(e);
    }
    return;
  }

  async getReportCertifier(reportType) {
    try {
      const sql = `
      select * from report_certifier rc
      where rc.id = ?
      `
      const data = await this.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements: [ reportType ]
      })
      console.log('data >>>>>> ',data)
      return data? data[0]: null
    } catch (error) {
      console.log(error);
      return error
    }
  }

}

function toBudishYearMonth(monthYear: string) {
  throw new Error('Function not implemented.');
}
