import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function thaiMonths(num) {
  if (!num) {
    return '';
  }
  const months_th = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",];
  return months_th[num - 1];
}

function thaiMonthsMini(num) {
  if (!num) {
    return '';
  }
  const months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",];
  return months_th[num - 1];
}

function _thaiNumber(num) {
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

function toThaiDate(date: Date) {
  if (!date) {
    return '';
  }
  // const new_date = date.toISOString().substring(0, 10);
  const new_date = dayjs(date).tz('Asia/Bangkok').format('YYYY-MM-DD');
  return `${_thaiNumber(new_date.substring(8, 10))} ${thaiMonths(new_date.substring(5, 7))} ${_thaiNumber(Number(new_date.substring(0, 4)) + 543)}`;
}

function toThaiTime(date: Date) {
  if (!date) {
    return '';
  }
  const new_date = dayjs(date).tz('Asia/Bangkok').format('HH:mm');
  return `${_thaiNumber(new_date.substring(0, 2))}.${_thaiNumber(new_date.substring(3, 5))}`;
}

export function ifEquals(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
}

export function thiaNumber(arg1) {
  if (!arg1 || arg1 == null) return '';
  return `${_thaiNumber(arg1)}`;
}

// แปลงเดือนและปีให้อยู่ในรูปแบบ "เดือน ปี" ภาษาไทย
export function toThaiWord(year_month: string): string {
  if (!year_month) return '';
  const new_year_month = dayjs(year_month).tz('Asia/Bangkok').format('YYYY-MM');
  const year = _thaiNumber(Number(new_year_month.substring(0, 4)) + 543);
  const month = thaiMonths(Number(new_year_month.substring(5, 7)));
  return `${month} ${year}`;  // รูปแบบ "เดือน ปี"
}

export function hlp(echo) {
  return `Echo: ${echo}.`;
}

export function toBudishYearMonth(year_month: string): string {
  if (!year_month) return '';
  const new_year_month = dayjs(year_month).tz('Asia/Bangkok').format('YYYY-MM');
  const year = (Number(new_year_month.substring(0, 4)) + 543);
  const month = thaiMonths(Number(new_year_month.substring(5, 7)));
  return `${month} ${year}`;  // รูปแบบ "เดือน ปี"
}


