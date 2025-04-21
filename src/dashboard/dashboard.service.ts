import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { find, get, sumBy, join, filter, map } from 'lodash';
import { Complaints } from 'src/models/complaints.model';
import { TblDepartment } from 'src/models/department.model';
import { CLIENT_RENEG_LIMIT } from 'tls';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ComplaintData {
  deptname: string;
  status: string;
  notified_office_count: number;
  deptofficeno: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(Complaints)
    private readonly complaints: typeof Complaints,
    @InjectModel(TblDepartment)
    private readonly tblDepartment: typeof TblDepartment,
  ) {}

  async getTop3Complain(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }
      const sql = 
      `
        select c.source_type, count(c.source_type) as source_type_count, m.mas_name as source_name from tbl_complaints c
        inner join tbl_master m on m.mas_code = c.source_type and m.mas_group_code = 4
        where date(c.receive_at) = ? and c.deleted_at is null
        group by c.source_type
        order by source_type_count desc
        LIMIT 3
      `;
      const data = await this.sequelize.query(sql, {
        replacements: [dateSearch]
      });
      return data ? data[0] : [];
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getTop3Progress(dateSearch?: string): Promise<any> {
    try {
      let current_date = new Date();
  
    
      if (dateSearch) {
        current_date = new Date(Date.parse(dateSearch));
      }
  
    
      const start_date2 = new Date(current_date.getFullYear(), current_date.getMonth() - 2, 1);
      const end_date = new Date(current_date.getFullYear(), current_date.getMonth() + 1, 0);
  
    
      const start_date2_str = start_date2.toISOString().substring(0, 10);
      const current_date2 = end_date.toISOString().substring(0, 10);
  
    
      const sql = `
        (SELECT year_and_month, COUNT(year_and_month) AS year_and_month_count, status FROM (
          SELECT DATE_FORMAT(progress_at, '%Y-%m') AS year_and_month, status FROM tbl_complaints
          WHERE status = '2'
          AND progress_at BETWEEN ? AND ?
          AND deleted_at IS NULL
        ) AS complaints_count
        GROUP BY year_and_month
        ORDER BY year_and_month)
  
        UNION
  
        (SELECT year_and_month, COUNT(year_and_month) AS year_and_month_count, status FROM (
          SELECT DATE_FORMAT(terminate_at, '%Y-%m') AS year_and_month, status FROM tbl_complaints
          WHERE status = '3'
          AND terminate_at BETWEEN ? AND ?
          AND deleted_at IS NULL
        ) AS complaints_count
        GROUP BY year_and_month
        ORDER BY year_and_month)
      `;
  
      const result = await this.sequelize.query(sql, {
        replacements: [start_date2_str, current_date2, start_date2_str, current_date2]
      });
  
      let data = result ? result[0] : [];
      let process_series: number[] = [];
      let close_series: number[] = [];
      let labels: string[] = [];
  
    
      for (let i = 1; i >= -1; i--) {
        const find_date = new Date(current_date.getFullYear(), current_date.getMonth() + i, 1);
        const find_date_str = find_date.toISOString().substring(0, 7);
        labels.unshift(find_date_str);
  
        let found_process = data.find((d: any) => d.year_and_month === find_date_str && d.status === '2');
        process_series.unshift(found_process ? found_process['year_and_month_count'] : 0);
  
        let found_close = data.find((d: any) => d.year_and_month === find_date_str && d.status === '3');
        close_series.unshift(found_close ? found_close['year_and_month_count'] : 0);
      }
  
      return {
        series: [
          { name: 'ดำเนินการอยู่', data: process_series },
          { name: 'ยุติ', data: close_series }
        ],
        labels
      };
  
    } catch (e) {
      console.error(e);
      return [];
    }
  }    
  
      
    async getMostPopular(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }
      const sql = 
      `
        SELECT source_type, COUNT(source_type) AS source_type_count, m.mas_name AS source_name  FROM tbl_complaints c
        inner join tbl_master m on m.mas_code = c.source_type and m.mas_group_code = 4
        WHERE DATE(receive_at) = ? and c.deleted_at is null
        GROUP BY source_type
        ORDER BY source_type_count DESC
      `;
      const result = await this.sequelize.query(sql, {
        replacements: [dateSearch]
      });
      const data = result ? result[0] : [];
      const sum = sumBy(data, item => item['source_type_count']);
      const cals = data.map(item => {
        return {
          source_type: item['source_type'],
          source_type_count: item['source_type_count'],
          source_name: item['source_name'],
          source_type_percent: ((item['source_type_count']/sum)*100).toFixed(2)
        }
      });
      return cals;
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getCompareProcessClose(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }
      const sql = `
        SELECT status, COUNT(status) AS status_count FROM tbl_complaints
        WHERE DATE(receive_at) = ? AND status IN ('1', '2', '3') AND deleted_at IS NULL
        GROUP BY status
        ORDER BY status
      `;
  
      const result = await this.sequelize.query(sql, {
        replacements: [dateSearch]
      });
      const data = result ? result[0] : [];
  
      const statusMap = {
        '1': { status: '1', status_count: 0, label: 'เรื่องร้องเรียน' },
        '2': { status: '2', status_count: 0, label: 'กำลังดำเนินการ' },
        '3': { status: '3', status_count: 0, label: 'ยุติ' }
      };
  
      data.forEach(item => {
        statusMap[item['status']].status_count = item['status_count'];
      });
  
      return Object.values(statusMap);

    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getCompareProcessClose2Years(dateSearch?: string): Promise<any> {
    try {
      let current_date = new Date();
      let start_date = new Date();
      if (dateSearch) {
        current_date = new Date(Date.parse(dateSearch));
        start_date = new Date(Date.parse(dateSearch));
      }

      start_date.setFullYear(current_date.getFullYear() - 1);
      const current_date2 = current_date.toISOString().substring(0, 4);
      const start_date2 = start_date.toISOString().substring(0, 4);


      const sql = 
      `
        (SELECT year_and_month, COUNT(year_and_month) AS year_and_month_count, status FROM (
          SELECT YEAR(progress_at) AS year_and_month, status FROM tbl_complaints
          WHERE status = '2'
          AND YEAR(progress_at) BETWEEN ? AND ?
          and deleted_at is null
        ) AS complaints_count
        GROUP BY year_and_month
        ORDER  BY year_and_month)
        UNION 
        (SELECT year_and_month, COUNT(year_and_month) AS year_and_month_count, status FROM (
          SELECT YEAR(terminate_at) AS year_and_month, status FROM tbl_complaints
          WHERE status = '3'
          AND YEAR(terminate_at) BETWEEN ? AND ?
          and deleted_at is null
        ) AS complaints_count
        GROUP BY year_and_month
        ORDER  BY year_and_month)
      `;
      const result = await this.sequelize.query(sql, {
        replacements: [start_date2, current_date2, start_date2, current_date2]
      });
      const data = result ? result[0] : [];

      let process_series: number[] = [];
      let close_series: number[] = [];
      let labels: string[] = [];

      for (let i=Number(start_date2);i<=Number(current_date2);i++) {

        const find_date = i;
        labels.push(find_date+'');
        
        let found_process = find(data, { year_and_month: find_date, status: '2' });
        if (found_process) {
          process_series.push(found_process['year_and_month_count']);
        } else {
          process_series.push(0);
        }

        let found_close = find(data, { year_and_month: find_date, status: '3' });
        if (found_close) {
          close_series.push(found_close['year_and_month_count']);
        } else {
          close_series.push(0);
        }
      }
// =======================Nooooooo===============================
      return {
        series: [
          { name: 'ดำเนินการอยู่', data: process_series },
          { name: 'ยุติ', data: close_series }
        ],
        labels
      };
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getCountComplaints(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }
      const sql = 
      `
        SELECT 
          tc.source_type, 
          tm.mas_code, 
          COUNT(tc.source_type) AS total_result, 
          tm.mas_name as source_name, 
          DATE(tc.date_received) 
        FROM tbl_master tm
        LEFT JOIN tbl_complaints tc 
          ON tc.source_type = tm.mas_code 
          AND (tc.date_received IS NULL OR DATE(tc.date_received) = ?)
        WHERE tm.mas_group_code = 4 and tc.deleted_at is null
        GROUP BY tm.mas_name, tm.mas_code
        ORDER BY total_result DESC;
      `;
      
      const result = await this.sequelize.query(sql, {
        replacements: [dateSearch]
      });
      
      
      const data = result ? result[0] : [];
      
      const series: number[] = data.map(item => item['total_result']);
      const labels: string[] = data.map(item => item['source_name']);
      return { series, labels };
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getCountComplainType(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }
      const sql = 
      `
        select complaint_type, count(complaint_type) as complaint_type_count, m.mas_name as complaint_name from tbl_complaints c
        inner join tbl_master m on m.mas_code = c.complaint_type and m.mas_group_code = '2'
        where date(receive_at) = ? and category_type = '1' and c.deleted_at is null
        group by complaint_type 
        order by complaint_type_count desc, complaint_type asc
      `;
      const result = await this.sequelize.query(sql, {
        replacements: [dateSearch]
      });
      const data = result ? result[0] : [];
      const series: number[] = data.map(item => item['complaint_type_count']);
      const labels: string[] = data.map(item => item['complaint_name']);

      let data_3 = [];
      if (data.length > 3) {
        data_3 = data.slice(0, 3);
      } else {
        data_3 = data.slice(0, data.length);
      }

      const sum = sumBy(data_3, item => item['complaint_type_count']);
      const cals = data_3.map(item => {
        return {
          label: item['complaint_name'],
          value: ((item['complaint_type_count']/sum)*100).toFixed(2)
        }
      });
      
      return { series, labels, top3: cals };
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getTop3Department(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }
      const sql = 
      `
        select * from (
          select count(notified_office) as notified_office_count, d.deptofficeno, d.deptname from tbl_complaints c 
          inner join tbl_department d on c.notified_office = d.deptofficeno
          where (date(progress_at) = ? and status = '2') or (date(terminate_at) = ? and status = '3') and c.deleted_at is null
          group by notified_office
          order by notified_office_count desc, d.deptofficeno asc
          limit 3
        ) top3_department
        order by deptofficeno
      `;
      const result = await this.sequelize.query(sql, {
        replacements: [dateSearch, dateSearch]
      });
      return result ? result[0] : [];
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async testGetData(items?: any, id?: any): Promise<any> {
    for(let i = 0; i < items.length; i++) {
     if(id == items[i]['notified_office'])  {

      return items[i];
     }
    }
  }

  async getTop3DepartmentComplain(dateSearch?: string): Promise<any> {
    try {
      if (!dateSearch) {
        dayjs(dateSearch).tz('Asia/Bangkok').format('YYYY-MM');
      }
  
      const top3Department = await this.getTop3Department(dateSearch);

      const top3Department2 = await this.sequelize.query('SELECT deptofficeno from tbl_department');
  
      const deptOfficeNo = top3Department2[0].map(item => item['deptofficeno']+'');
      const sql = 
      `
        (
        select status, count(notified_office) as notified_office_count, notified_office, d.deptname from tbl_complaints c 
        inner join tbl_department d on c.notified_office = d.deptofficeno
        where date(progress_at) = ? and status = '2' and c.deleted_at is null and sub_notified_office is NULL
        group by notified_office
        order by d.deptofficeno 
        )
        union
        (
        select status, count(notified_office) as notified_office_count, notified_office, d.deptname from tbl_complaints c 
        inner join tbl_department d on c.notified_office = d.deptofficeno
        where date(terminate_at) = ? and status = '3' and c.deleted_at is null and sub_notified_office is NULL
        group by notified_office
        order by d.deptofficeno
        )
        union
      (
      select status, count(sub_notified_office) as notified_office_count, sub_notified_office, d.deptname
      from tbl_complaints c 
      inner join tbl_department d on c.sub_notified_office = d.deptofficeno
      where date(progress_at) = ? and status = '2' and c.deleted_at is null and sub_notified_office is not NULL 
      group by notified_office
      order by d.deptofficeno 
      )
      union
      (
      select status, count(sub_notified_office) as notified_office_count, sub_notified_office, d.deptname
      from tbl_complaints c 
      inner join tbl_department d on c.sub_notified_office = d.deptofficeno
      where date(terminate_at) = ? and status = '3' and c.deleted_at is null and sub_notified_office is not NULL 
      group by notified_office
      order by d.deptofficeno
      )
      `;

      
      
  
      const replacements = [dateSearch, dateSearch, dateSearch, dateSearch];
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
  
        let found_process = find(data, { notified_office: item+'' });
          
        let found_close = find(data, { notified_office: item+'', status: '3' });
        if(!found_process && !found_close) return;

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

        sum_series.push(process_series[process_series.length-1] + close_series[close_series.length-1]);
  
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
  

  async getLatestComplain(dateSearch?: string, limit?: number): Promise<any> {
    try {
      if (!dateSearch) {
        dateSearch = new Date().toISOString().substring(0, 10);
      }

      let sql_limit = '';
      if (limit) {
        sql_limit = `limit ${limit}`;
      }
      const sql = 
      `
        SELECT cid, source_type, m.mas_name AS source_type_name, complaint_type, m2.mas_name AS complaint_type_name, receive_at AS date_received 
        FROM tbl_complaints c
        INNER JOIN tbl_master m ON c.source_type = m.mas_code AND m.mas_group_code = 4
        LEFT JOIN tbl_master m2 ON c.complaint_type = m2.mas_code AND ((m2.mas_group_code = 2 AND c.category_type = 1) OR (m2.mas_group_code = 3 AND c.category_type = 2))
        WHERE DATE(receive_at) = ? 
        AND c.deleted_at IS NULL
        ORDER BY cid DESC
        ${sql_limit}
      `;
      const result = await this.sequelize.query(sql, {
        replacements: [dateSearch]
      });
      return result ? result[0] : [];
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getAllComplains(startDateSearch?: string, endDateSearch?: string): Promise<any> {
    try {
      let value_condition: string[];
      let sql_condition = '';
      if (startDateSearch && endDateSearch) {
        sql_condition = `and date(receive_at) between ? and ?`;
        value_condition = [startDateSearch, endDateSearch];
      } else if (startDateSearch) {
        sql_condition = `and date(receive_at) >= ?`;
        value_condition = [startDateSearch];
      } else if (endDateSearch) {
        sql_condition = `and date(receive_at) <= ?`;
        value_condition = [endDateSearch];
      }

      const sql = 
      `
      select m.mas_code, m.mas_name, IFNULL(cp.source_type_count, 0) as source_type_count from tbl_master m 
      left join 
        (
          select source_type, count(source_type) as source_type_count FROM tbl_complaints c
          where c.deleted_at is null ${sql_condition}
          group by source_type
          ) as cp
      on cp.source_type = m.mas_code 
      where m.mas_group_code = '4'
      order by m.mas_seq
      `;
      const data = await this.sequelize.query(sql, {
        replacements: value_condition
      });
      return data ? data[0] : [];
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getCompareComplaintType(category_type: string, startDateSearch?: string, endDateSearch?: string): Promise<any> {
    try {
      let value_condition: string[];
      let sql_condition = '';
      if (startDateSearch && endDateSearch) {
        sql_condition = `between ? and ?`;
        value_condition = [startDateSearch, endDateSearch, startDateSearch, endDateSearch];
      } else if (startDateSearch) {
        sql_condition = `>= ?`;
        value_condition = [startDateSearch, startDateSearch];
      } else if (endDateSearch) {
        sql_condition = `<= ?`;
        value_condition = [endDateSearch, endDateSearch];
      }

      let mas_group_code = '2';
      if (category_type === '2') {
        mas_group_code = '3';
      }

      const sql = 
      `
        SELECT 
        c.complaint_type, count(c.complaint_type) as complaint_type_count, m.mas_name 
        FROM tbl_complaints c
        inner join tbl_master m on c.complaint_type = m.mas_code and m.mas_group_code = ?
        WHERE
        c.category_type = ? and 
        ((date(progress_at) ${sql_condition} and status = '2') or (date(terminate_at) ${sql_condition} and status = '3'))
        and c.deleted_at is null
        GROUP BY c.complaint_type
        ORDER BY c.complaint_type
      `;

      const result = await this.sequelize.query(sql, {
        replacements: [mas_group_code, category_type, ...value_condition]
      });
      const data = result ? result[0] : [];

      let series: string[] = [];
      let lebels: string[] = [];

      if (data) {
        series = map(data, 'complaint_type_count');
        lebels = map(data, 'mas_name');
      }

      return { series, lebels };
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getCompareProcessCloseOfComplain(category_type: string, startDateSearch?: string, endDateSearch?: string): Promise<any> {
    try {
      let value_condition: string[];
      let sql_condition = '';
      if (startDateSearch && endDateSearch) {
        sql_condition = `between ? and ?`;
        value_condition = [startDateSearch, endDateSearch, startDateSearch, endDateSearch];
      } else if (startDateSearch) {
        sql_condition = `>= ?`;
        value_condition = [startDateSearch, startDateSearch];
      } else if (endDateSearch) {
        sql_condition = `<= ?`;
        value_condition = [endDateSearch, endDateSearch];
      }

      let mas_group_code = '2';
      if (category_type === '2') {
        mas_group_code = '3';
      }

      const sql = 
      `
        SELECT 
        c.status, c.complaint_type, count(c.complaint_type) as complaint_type_count, m.mas_name 
        FROM tbl_complaints c
        inner join tbl_master m on c.complaint_type = m.mas_code and m.mas_group_code = ?
        WHERE
        c.category_type = ? and 
        ((date(progress_at) ${sql_condition} and status = '2') or (date(terminate_at) ${sql_condition} and status = '3'))
        and c.deleted_at is null
        GROUP BY c.status, c.complaint_type
        ORDER BY c.status, c.complaint_type
      `;

      const result = await this.sequelize.query(sql, {
        replacements: [mas_group_code, category_type, ...value_condition]
      });
      
      const data = result ? result[0] : []; 


      const data_process = filter(data, { status: '2' });

      const sum_process = sumBy(data_process, item => item['complaint_type_count']);

      const data_close = filter(data, { status: '3' });

      const sum_close = sumBy(data_close, item => item['complaint_type_count']);

      const percent_process = sum_process > 0 ? ((sum_process/(sum_process+sum_close))*100).toFixed(2) : "0.00";
      
      const percent_close = sum_process > 0 ? ((sum_close/(sum_process+sum_close))*100).toFixed(2) : "0.00";
      

      const data_compare_complaint_type = await this.getCompareComplaintType(category_type, startDateSearch, endDateSearch);

      return {
        status: [
          {
            "status": "2",
            "status_count": sum_process,
            "status_percent": percent_process,
            "label": "กำลังดำเนินการ"
          },
          {
            "status": "3",
            "status_count": sum_close,
            "status_percent": percent_close,
            "label": "ยุติ"
          }
        ],
        complaint_type: data_compare_complaint_type
      };
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getProgressByDateRange(startDateSearch?: string, endDateSearch?: string): Promise<any> {
    try {
      let current_date = new Date();
      let start_date = new Date();
      let end_date = new Date();
  
      // If endDateSearch is provided, parse it and set the start and end dates
      if (endDateSearch) {
        current_date = new Date(Date.parse(endDateSearch));
        end_date = new Date(current_date); // Initialize end_date to current_date
        start_date = new Date(Date.parse(startDateSearch));
        
        // Set start date to the beginning of the day
        start_date.setHours(0, 0, 0, 0);
        // Set end date to the end of the day
        end_date.setHours(23, 59, 59, 999);
      }
  
      // Prepare the start_date for the first day of the month for your logic
      const start_date2 = new Date(start_date.getFullYear(), start_date.getMonth(), 1);
      start_date2.setDate(start_date2.getDate() + 1);
      
      const monthDiff = current_date.getMonth() - start_date.getMonth() +
        (12 * (current_date.getFullYear() - start_date.getFullYear()));
        
  
      const sql = `
        (SELECT 
        year_and_month,
         COUNT(year_and_month) AS year_and_month_count, 
         status FROM (
          SELECT 
          DATE_FORMAT(progress_at, '%Y-%m') AS year_and_month, 
          status 
          FROM tbl_complaints
          WHERE status = '2'
          AND progress_at BETWEEN ? AND ?
          and deleted_at is null
        ) AS complaints_count
        GROUP BY year_and_month
        ORDER  BY year_and_month)
  
        UNION
  
        (SELECT 
        year_and_month,
         COUNT(year_and_month) AS year_and_month_count, 
         status FROM (
          SELECT 
          DATE_FORMAT(terminate_at, '%Y-%m') AS year_and_month, 
          status 
          FROM tbl_complaints
          WHERE status = '3'
          AND terminate_at BETWEEN ? AND ?
          and deleted_at is null
        ) AS complaints_count
        GROUP BY year_and_month
        ORDER  BY year_and_month)
      `;
  
      // Use the modified start and end dates in the query
      const result = await this.sequelize.query(sql, {
        replacements: [start_date, end_date, start_date, end_date]
      });
  
      let data = result ? result[0] : [];
  
      let process_series: number[] = [];
      let close_series: number[] = [];
      let labels: string[] = [];

      // Loop through the months and gather data
      for (let i = 0; i <= monthDiff; i++) {
        const find_date = dayjs(start_date).tz('Asia/Bangkok').format('YYYY-MM');
  
        labels.push(find_date);
  
        let found_process = find(data, { year_and_month: find_date, status: '2' });
        if (found_process) {
          process_series.push(found_process['year_and_month_count']);
        } else {
          process_series.push(0);
        }
  
        let found_close = find(data, { year_and_month: find_date, status: '3' });
        if (found_close) {
          close_series.push(found_close['year_and_month_count']);
        } else {
          close_series.push(0);
        }
  
        start_date.setMonth(start_date.getMonth() + 1);
      }
  
      

      return {
        series: [
          { name: 'ดำเนินการอยู่', data: process_series },
          { name: 'ยุติ', data: close_series }
        ],
        labels
      };
  
    } catch (e) {
      console.error(e);
    }
    return [];
  }
  
  async getDepartment(deptType: string, startDateSearch?: string, endDateSearch?: string): Promise<any> {
    try {
      const sql = 
      `
        SELECT COUNT(COALESCE(sub_notified_office , notified_office)) AS notified_office_count, d.deptofficeno, d.deptname
        FROM tbl_complaints c 
        INNER JOIN tbl_department d ON COALESCE(c.sub_notified_office , c.notified_office) = d.deptofficeno AND d.depttype = ?
        WHERE (
            (DATE(progress_at) BETWEEN ? AND ? AND status = '2') 
            OR 
            (DATE(terminate_at) BETWEEN ? AND ? AND status = '3')
        ) 
        AND c.deleted_at IS NULL
        GROUP BY notified_office
        ORDER BY d.deptofficeno;

      `;
      const result = await this.sequelize.query(sql, {
        replacements: [Number(deptType), startDateSearch, endDateSearch, startDateSearch, endDateSearch]
      });
      
      return result ? result[0] : [];
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getDepartmentComplain(deptType: string, startDateSearch: string, endDateSearch: string): Promise<any> {
    try {
      const department = await this.getDepartment(deptType, startDateSearch, endDateSearch);
      
      const deptOfficeNo = department.map(item => item['deptofficeno']+'')

      
      const sql = 
      `
      (
        select status, count(COALESCE(sub_notified_office, notified_office)) as notified_office_count, 
        notified_office, d.deptname, d.depttype, c.sub_notified_office 
        from tbl_complaints c 
    inner join tbl_department d 
    on (COALESCE(c.sub_notified_office, c.notified_office) = d.deptofficeno)
    and d.depttype = ?
    where date(progress_at) between ? and ? 
    and status = '2'
    and c.deleted_at is null
    group by COALESCE(sub_notified_office, notified_office), notified_office, d.deptname, d.depttype, c.sub_notified_office
    )
    UNION ALL
    (
      select status, count(COALESCE(sub_notified_office, notified_office)) as notified_office_count, 
      notified_office, d.deptname, d.depttype, c.sub_notified_office 
      from tbl_complaints c 
      inner join tbl_department d 
    on (COALESCE(c.sub_notified_office, c.notified_office) = d.deptofficeno)
    and d.depttype = ?
    where date(terminate_at) between ? and ? 
    and status = '3'
    and c.deleted_at is null
    group by COALESCE(sub_notified_office, notified_office), notified_office, d.deptname, d.depttype, c.sub_notified_office
    )
    ORDER BY notified_office;
    `;
    const result = await this.sequelize.query(sql, {
        replacements: [Number(deptType), startDateSearch, endDateSearch, Number(deptType), startDateSearch, endDateSearch],
        logging: true
        
      });
      
      const data = result ? result[0] : [];
      
      let process_series: number[] = [];
      let close_series: number[] = [];
      let sum_series: number[] = [];
      let labels: string[] = [];
      
      const new_data = deptOfficeNo.map(item => {
        let office_name;
          const key = deptType === '2' ? 'sub_notified_office' : 'notified_office';
          let found_process = find(data, { [key]: item+'', status: '2' });
          if (found_process) {
            process_series.push(found_process['notified_office_count']);
            
            if (!office_name) {
              office_name = found_process['deptname'];
            }
          } else {
            process_series.push(0);
          }
          
          let found_close = find(data, { [key]: item+'', status: '3' });
          if (found_close) {
            close_series.push(found_close['notified_office_count']);
            
            if (!office_name) {
              office_name = found_close['deptname'];
            }
        } else {
          close_series.push(0);
        }
        
        sum_series.push(process_series[process_series.length-1] + close_series[close_series.length-1]);
        
        if (office_name) {
          labels.push(office_name);
        }
      });
// ============================================================
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
  

  
  async getDepartmentComplaintoday(deptType: number[], startDateSearch: string, endDateSearch: string): Promise<any> {
    try {
        // const departmentPromises = deptType.map(type => this.getDepartment(type.toString(), startDateSearch, endDateSearch));
        // const departments = await Promise.all(departmentPromises);
        
        // const department = departments.flat();
        // const deptOfficeNo = department.map(item => item['deptofficeno']);
        const top3Department2 = await this.sequelize.query('SELECT deptofficeno from tbl_department');
    
        const deptOfficeNo = top3Department2[0].map(item => item['deptofficeno']+'');
        const sql = `
        SELECT 
            d.deptname, 
            c.status, 
            d.deptofficeno, 
            COALESCE(c.sub_notified_office, c.notified_office) AS deptofficeno, 
            COUNT(*) AS notified_office_count
        FROM 
            tbl_department d
        LEFT JOIN 
            tbl_complaints c 
        ON 
            COALESCE(c.sub_notified_office, c.notified_office) = d.deptofficeno
        WHERE 
            (c.status = '2' OR c.status = '3' OR c.status IS NULL)
            AND c.deleted_at IS NULL
            AND (DATE(c.progress_at) = ? OR DATE(c.terminate_at) = ?)
        GROUP BY 
            d.deptname, 
            c.status, 
            d.deptofficeno
        ORDER BY 
            d.deptofficeno;

      `;
        const result = await this.sequelize.query(sql,{
          replacements: [startDateSearch, startDateSearch]
        });
        
        const data: ComplaintData[] = (result[0] as ComplaintData[]) || [];
        
        let process_series: number[] = [];
        let close_series: number[] = [];
        let sum_series: number[] = [];
        let labels: string[] = [];
        
  
    
        const new_data = deptOfficeNo.map(async (item) => {
  
          let office_name;
    
          let found_process = find(data, { deptofficeno: item+'' });
            
          let found_close = find(data, { deptofficeno: item+'', status: '3' });
          if(!found_process && !found_close) return;
  
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
  
          sum_series.push(process_series[process_series.length-1] + close_series[close_series.length-1]);
    
          if (office_name) {
            labels.push(office_name);
          }
        });
  
    
        // Combine the series and labels into one array of objects
        let combinedData = labels.map((label, index) => ({
          label,
          process: process_series[index],
          close: close_series[index],
          sum: sum_series[index]
        }));
    
        // Sort the combined data by the 'sum' value in descending order
        combinedData.sort((a, b) => b.sum - a.sum);
    
        // Update the series and labels with the sorted values
        labels = combinedData.map(item => item.label);
        process_series = combinedData.map(item => item.process);
        close_series = combinedData.map(item => item.close);
        sum_series = combinedData.map(item => item.sum);
    
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
        return []; // หรือ return ค่าที่เหมาะสม
    }
}

}
