import { Column, DataType, HasMany, Model, Table, BelongsTo, ForeignKey } from "sequelize-typescript";
import { MASDistrict } from "./mas_districts.model";
import { TblDepartment } from './department.model';

@Table({
  tableName: "tbl_complaints",
  freezeTableName: true,
  paranoid: true,
  timestamps: false,
})
export class Complaints extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  cid: number;


  @Column
  source_type: string;

  @Column
  date_received: Date;

  @Column
  anonymous: boolean;

  @Column
  first_name: string;

  @Column
  last_name: string;

  @Column
  phone_number: string;

  @Column
  additional_contact: string;

  @Column
  category_type: string;

  @Column
  complaint_type: string;

  @Column
  province: number;

  @Column
  district: number;

  @Column
  sub_district: number;

  @Column
  road: string;

  @Column
  latitude: number;

  @Column
  longitude: number;

  @Column
  area: string;

  @Column
  attachment_received1: string;

  @Column
  attachment_received2: string;

  @Column
  attachment_received3: string;

  @Column
  attachment_received4: string;

  @Column
  attachment_received5: string;

  @Column
  document: string;

  @Column
  date_closed: Date;

  @Column
  explanation_result: string;

  @Column
  attachment_closed1: string;

  @Column
  attachment_closed2: string;

  @Column
  attachment_closed3: string;

  @Column
  attachment_closed4: string;

  @Column
  attachment_closed5: string;

  @Column
  status: string;

  @Column
  receive_at: Date;

  @Column
  progress_at: Date;

  @Column
  terminate_at: Date;

  @Column
  created_at: Date;

  @Column
  updated_at: Date;

  @Column
  created_by: string;

  @Column
  updated_by: string;

  @Column
  deleted_at: Date;

  @Column
  deleted_by: string;

  @Column
  notified_office: string;

  @Column
  sub_notified_office: string;

  @Column
  complaint_other: string;

  @Column
  receive_by: string;

  @Column
  certifier_by: string;

  @Column
  certifier_role: string;

}
