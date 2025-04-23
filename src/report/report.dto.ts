export class ReportData {
  sourceTypeAllText: string;
  dataSummarySource: Array<any>;
  dataSummaryComplaint: Array<any>;
  dataSummaryDepartment: Array<any>;



  
  countProgress: string;
  countTerminate: string;
  percentProgress: string;
  percentTerminate: string;
  topSourceType: string;
  topComplaint: string;
  topDepartment: string;
  certifierName: string;
  certifierRole: string;
}
export class Summarymouth {
  row_num: number;
  complaint_name?: string;
  deptshort?: string;
  sub_deptshort?: string;
  receive_at?: string;
  mas_name?: string;
  road?: string;
  area?: string;
  explanation_result?: string;
  status? :string
}
export class ReportRow {
  formatted_month: string;
  year_month: string;
  total_count: number;
  status_1_count: number;
  status_2_count: number;
  status_3_count: number;
}

export class ComplaintData {
  year_and_month: string;
  year_and_month_count: number;
  status: string;
}
